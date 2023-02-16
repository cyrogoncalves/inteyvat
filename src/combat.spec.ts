import { strike } from "./combat";

const enemy = { // everybody wants to be, oh the misery
  hp: 100
}
const grid = {
  targetsFor: (skill) => [enemy]
}
const unit = {
  skills: {
    normal: {damage: {value: 1, type: "physical"}},
    elemental: {
      damage: {value: 2, type: "pyro"},
      pyro: { duration: 10 }
    }
  },
  stats: {aim: 0}
}
const unit2 = {
  skills: {
    normal: {
      damage: {value: 1, type: "hydro"},
      hydro: { duration: 10 }
    },
    elemental: {
      damage: {value: 2, type: "hydro"},
      pyro: { duration: 10 }
    }
  },
  stats: {aim: 0, vaporizeBonus: 2}
}


describe('use attack skill', () => {
  it("target takes normal attack damage", () => {
    // target takes normal attack damage
    strike(unit, grid, "normal");
    expect(enemy).toEqual({ hp:99 });

    // deals unit's skill damage to target, and applies pyro
    strike(unit, grid, "elemental");
    expect(enemy).toEqual({ hp:97, pyro:{duration:10} });

    // deals second unit's hydro skill damage to target, vaporizes
    strike(unit2, grid, "normal");
    expect(enemy).toEqual({ hp:95 });
  });
});