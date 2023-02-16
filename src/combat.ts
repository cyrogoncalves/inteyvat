const PHCE = ["pyro", "hydro", "cryo", "electro"] as const;

type Reaction = { clause:($)=>boolean, effect:($)=>void, priority:number };

const auraReaction = (el1, el2, aura): Reaction => ({
  clause: ($) => $[el1] && $[el2],
  effect: $ => {
    $[aura.label] = aura;
    delete $[el1];
    delete $[el2];
  },
  priority: 95
})

// reactions
const catalyze = auraReaction("dendro", "electro", "quicken");
// const burn = auraReaction("dendro", "pyro", "burn");
const superconduct = auraReaction("cryo", "electro", "superconduct");
const freeze = auraReaction("cryo", "hydro", "frozen");
const vaporize: Reaction = {
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
const melt: Reaction = {
  clause: $ => $.cryo && $.pyro,
  effect: $ => {
    const keys = Object.keys($);
    if (keys.indexOf("pyro") > keys.indexOf("cryo")) {
      $.damage.value *= $.source.meltBonus || 1;
      delete $.pyro
    } else { // reverse melt
      $.damage.value *= $.source.reverseMeltBonus || 1;
      $.pyro.duration -= 5;
    }
    delete $.cryo;
  },
  priority: 100
}
const spread: Reaction = {
  clause: $ => $.quicken && $.dendro,
  effect: $ => {
    $.damage += $.source.spreadBonus || 0.0;
    delete $.dendro;
  },
  priority: 100
}
const aggravate: Reaction = {
  clause: $ => $.quicken && $.electro,
  effect: $ => {
    $.damage += $.aggravateBonus || 0.0;
    delete $.electro;
  },
  priority: 100
}
const cristalize: Reaction = {
  clause: ($) => $.geo && PHCE.some(e => $[e]),
  effect: $ => {
    $.source.unit.addShield("cristalize"); // todo element
    PHCE.forEach(e => $[e].duration -= 4);
    delete $.geo;
  },
  priority: 100
}
const overload: Reaction = {
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
const bloom: Reaction = {
  clause: $ => $.hydro && $.dendro,
  effect: $ => {
    delete $.hydro;
    delete $.dendro;
    $.grid.placeCloseTo($.target, { name: "Dendro core" });
  },
  priority: 105
}
const electroCharge: Reaction = {
  clause: $ => $.hydro && $.electro,
  effect: $ => {
    $.hydro.duration -= 3;
    $.electro.duration -= 3;
    const damage = $.receiving.electroChargedBonus // 1
    $.hp -= damage
    $.map.enemiesCloseTo($.target).filter(e=>e.hydro)
      .forEach(e=>e.electro = { duration:10 });
  },
  priority: 205
}
const swirl: Reaction = {
  clause: $ => $.anemo && PHCE.some(e => $[e]),
  effect: $ => {
    const swirled = PHCE.find(e=>$[e]);
    const damage = $.source.swirlBonus // 1
    $.hp -= damage
    $.grid.enemiesCloseTo($.target).forEach(e => {
      e.swirl = { ephemeral:true, swirled }
    });
  },
  priority: 100
}
const reactions1: Reaction[] = [overload, catalyze, superconduct, freeze, bloom, spread, aggravate, vaporize, melt];
const chainedSwirlReaction: Reaction = {
  clause: $ => $.swirl,
  effect: $ => {
    $[$.swirl.swirled] = { duration:10 }
    reactions1.filter(r=>r.clause($)).forEach(r=>r.effect($))
    delete $.swirl;
  },
  priority: 110
}
const damage: Reaction = {
  clause: $ => $.damage,
  effect: $ => {
    if (Math.random() < $.source.aim * .05) // critical rate
      $.damage *= 1 + ($.source.blowout * .1) // critical damage multiplier
    $.hp -= $.damage.value;
    delete $.damage;
  },
  priority: 101
}
const clearCombat: Reaction = {
  clause: _ => true,
  effect: $ => {
    // Object.keys($).filter(k=>$[k].ephemeral).forEach(k=>delete $[k])
    delete $.source;
  },
  priority: 120
}
const reactions = [overload, catalyze, superconduct, freeze, bloom, spread, aggravate, vaporize, melt,
  chainedSwirlReaction, damage, clearCombat, electroCharge, swirl, cristalize]
  .sort((a,b)=> a.priority - b.priority)

// stats for attack consist on skill, unit, team and environment bonuses.
export const strike = (
  unit,
  grid,
  skillName:string,
  skill = unit.skills[skillName],
  targets = grid.targetsFor(skill)
): void => {
  targets.forEach(t => {
    t.source = { ...unit.stats, ephemeral:true, unit }
    Object.entries<object>(skill)
      .forEach(([k,v]) => t[k] = { ...v })
  })
  reactions.forEach(r => targets.filter($=>r.clause($)).forEach($=>r.effect($)));
  // todo charge energy
  // todo consume stamina
}