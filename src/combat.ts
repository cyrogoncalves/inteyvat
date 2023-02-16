const twoWayReaction = ($, element1, element2): boolean =>
  $.receiving.infusion === element1 && $.infusions.includes(element2)
  || $.receiving.infusion === element2 && $.infusions.includes(element1)

const auraReaction = (el1, el2, aura) => ({
  clause: ($) => $[el1] && $[el2],
  effect: $ => {
    $[aura.label] = aura;
    delete $[el1];
    delete $[el2];
  },
  priority: 95
})

const PHCE = ["pyro", "hydro", "cryo", "electro"] as const;

// reactions
const catalyze = auraReaction("dendro", "electro", "quicken");
const burn = auraReaction("dendro", "pyro", "burn");
const superconduct = auraReaction("cryo", "electro", "superconduct");
const freeze = auraReaction("cryo", "hydro", "frozen");
const vaporize = {
  clause: $ => $.hydro && $.pyro,
  effect: $ => {
    const keys = Object.keys($);
    if (keys.indexOf("hydro") > keys.indexOf("pyro")) {
      $.damage.value *= $.source.vaporizeBonus || 1;
      delete $.hydro
    } else { // reverse vaporize
      $.damage.value *= $.source.reverseVaporizeBonus || 1;
      $.hydro.duration -= 5;
    }
    delete $.pyro;
  },
  priority: 100
}
const melt = {
  clause: $ => $.cryo && $.pyro,
  effect: $ => {
    const keys = Object.keys($);
    if (keys.indexOf("pyro") > keys.indexOf("cryo")) {
      $.damage.value *= $.source.meltBonus || 1;
      delete $.pyro
    } else { // reverse vaporize
      $.damage.value *= $.source.reverseMeltBonus || 1;
      $.pyro.duration -= 5;
    }
    delete $.cryo;
  },
  priority: 100
}
const spread = {
  clause: $ => $.quicken && $.dendro,
  effect: $ => {
    $.damage += $.source.spreadBonus || 0.0;
    delete $.dendro;
  },
  priority: 100
}
const aggravate = {
  clause: $ => $.quicken && $.electro,
  effect: $ => {
    $.damage += $.aggravateBonus || 0.0;
    delete $.electro;
  },
  priority: 100
}
const cristalize = {
  clause: ($) => $.geo && PHCE.some(e => $[e]),
  effect: $ => {
    $.source.unit.addShield("cristalize"); // todo element
    PHCE.forEach(e => $[e].duration -= 4);
    delete $.geo;
  },
  priority: 100
}
const overload = {
  clause: $ => $.pyro && $.electro,
  effect: $ => {
    delete $.pyro;
    delete $.electro;
    const damage = $.source.overloadDamage; // 3
    $.hp -= damage
    // $.event({ tags: ["reaction", "overload"], damage }) todo
  },
  priority: 105
}
const bloom = {
  clause: $ => $.hydro && $.dendro,
  effect: $ => {
    delete $.hydro;
    delete $.dendro;
    $.grid.placeCloseTo($.target, { name: "Dendro core" });
  },
  priority: 105
}
const electroCharge = {
  clause: $ => twoWayReaction($, "hydro", "electro"),
  effect: $ => {
    $.infusions = $.infusions.filter(i => i !== "hydro" && i !== "dendro"); // todo tick down only
    const damage = $.receiving.electroChargedBonus // 1
    $.hp -= damage
    $.map.enemiesCloseTo($.target).filter(e=>e.hydro)
      .forEach(e=>e.electro = { duration:10 });
  },
  priority: 205
}
const swirl = {
  clause: ($) => $.anemo && PHCE.some(e => $[e]),
  effect: $ => {
    const swirled = PHCE.find(e=>$[e]);
    const damage = $.source.swirlBonus // 1
    $.hp -= damage
    $.grid.enemiesCloseTo($.target).forEach(e => {
      e.swirl = { ephemeral:true }
      e[swirled] = { duration:10 }
    });
  },
  priority: 100
}
const reactions1 = [overload, catalyze, superconduct, freeze, bloom, spread, aggravate]
const chainedSwirlReaction = {
  clause: ($) => $.swirl,
  effect: $ => {
    reactions1.filter(r=>r.clause($)).forEach(r=>r.effect($))
    delete $.swirl;
  },
  priority: 110
}
// damage, clear ephemeral infusions & "source"


// function "strike" receiving unit skill and map-grid
// calc targets
// calc damage (with critical)
// stack damage on targets (with power, cRate, cDmg, skill

// stats for attack consist on attack, unit, team and environment bonuses.
const strike = (unit, targets, atkName:string) => {
  const atk = unit.attacks[atkName];
  // TODO targets by attack and map-grid
  let stats = unit.stats;
  let dmg = atk.power + stats.power;
  if (Math.random() > stats.aim * .05) // critical rate
    dmg *= 1 + (stats.blowout * .1) // critical damage multiplier

  // reactions


  // todo charge energy
  // todo consume stamina
}