import {elementNames, EquipType, Mod, Stats, StatType, subStatNames} from "./model";

const mainStatPoolMap: { [e in EquipType]: StatType[] } = {
  "weapon": [],
  "flower": ["vit"],
  "plume": ["str"],
  "sands": ["str", "vit", "def", "em", "er"],
  "goblet": ["str", "vit", "def", "em", ...elementNames, "physical"],
  "circlet": ["str", "vit", "def", "em", "cr", "cd"],
}

const RNG = {
  select: (arr) => arr[Math.floor(Math.random()*arr.length)]
}

export const generateArtifactMods = (type: EquipType, rng=RNG): Mod[] => {
  const mainStat = rng.select(mainStatPoolMap[type]);
  const subStat1 = rng.select(subStatNames.filter(s => s != mainStat));
  const subStat2 = rng.select(subStatNames.filter(s => s != mainStat && s != subStat1));
  return [{type:mainStat, value:1}, {type:subStat1, value:0}, {type:subStat2, value: 0}];
}

export const upgradeArtifact = (mods:Mod[]):void => {
  mods.forEach(m => m.value++);
  if (mods[0].value < 3) mods[2].value--;
};

const base: Stats = Object.entries({
  vit: 10, str: 1, def: 0, em: 1, er: 1, cr: 1, cd: 15,
}).reduce((a, [type,value])=>({...a, [type]:{value}}), {});

export const statsFor = (mods: Mod[], from: Stats = { ...base }): Stats => {
  const ret = {...from};
  mods.forEach(({type, value}) =>
    (ret[type] ??= { value:0 }).value += value);
  return ret;
}