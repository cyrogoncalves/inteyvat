import { omastar } from "./omastar";

describe('path', () => {
  // beforeEach(() => {
  //   handlerInput = {...handlerInputMock};
  //   handlerInput.attributesManager.clearSessionAttributes();
  //   handlerInput.requestEnvelope.request.intent.name = "buscaPorGeneroIntent";
  // });

  it("from [0,0] to [1,1]", () => {
    const star = omastar({q:0, r:0}, {q:1, r:1});
    expect(star.map(o=>`${o.q}_${o.r}`)).toEqual(["1_0", "1_1"]);
  });

  it("from [0,0] to [8,5]", () => {
    const star = omastar({q:0, r:0}, {q:8, r:5});
    expect(star.map(o=>`${o.q}_${o.r}`)).toEqual(["1_0", "2_0", "3_0", "4_0", "5_0", "6_0", "7_0", "8_0", "8_1", "8_2", "8_3", "8_4", "8_5"]);
  });

  it("from [0,0] to [2,3]", () => {
    const star = omastar({q:0, r:0}, {q:2, r:3});
    expect(star.map(o=>`${o.q}_${o.r}`)).toEqual(["1_0", "2_0", "2_1", "2_2", "2_3"]);
  });

  it("from [3,3] to [1,3]", () => {
    const star = omastar({q:3, r:3}, {q:1, r:3});
    expect(star.map(o=>`${o.q}_${o.r}`)).toEqual(["2_3", "1_3"]);
  });
});