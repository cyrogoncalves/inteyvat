import { strike } from "./combat";

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

describe('use attack skill', () => {
  it("unit takes damage", () => {
    strike(unit, grid, "normal");
    expect(enemy).toEqual({ hp:99 });
  });
});