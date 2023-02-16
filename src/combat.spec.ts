import { strike } from "./combat";

describe('use attack skill', () => {
  it("target takes normal attack damage", () => {
    const enemy = { // everybody wants to be, oh the misery
      hp: 100
    }
    const grid = {
      targetsFor: (skill) => [enemy]
    }
    const unit = {
      skills: {
        normal: {damage: {value: 1, type: "physical"}}
      },
      stats: {aim: 0}
    }
    strike(unit, grid, "normal");
    expect(enemy).toEqual({ hp:99 });
  });

  it("deals unit's skill damage to target, and applies pyro", () => {
    const enemy = {hp: 100}
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
    strike(unit, grid, "elemental");
    expect(enemy).toEqual({ hp:98, pyro:{duration:10} });
  });
});