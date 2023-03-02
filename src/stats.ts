const elementNames = ["anemo", "pyro", "hydro", "cryo", "electro", "geo", "dendro"] as const;

export const subStatNames = ["vit", "str", "def", "em", "er", "cd", "cr"] as const;
export type SubStatType = typeof subStatNames[number];

export const mainStatNames = [...subStatNames, "healing", ...elementNames, "physical"] as const;
export type StatType = typeof mainStatNames[number];

export type Stats = { [stat in string]: {value:number} }

export const equipTypeNames = ["weapon", "flower", "plume", "sands", "goblet", "circlet"] as const;
type EquipType = typeof equipTypeNames[number];

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

// export const generateArtifact = (type: ArtifactType, rng=RNG)

export const generateArtifactMods = (
  type: EquipType,
  rng=RNG
): Stats => ({
  [rng.select(mainStatPoolMap[type])]: {value: 1},
  [rng.select(subStatNames)]: {value: 0},
  [rng.select(subStatNames)]: {value: 0},
})

const base: Stats = {
  vit: { value:10 },
  str: { value:1 },
  def: { value:0 },
  em: { value:1 },
  er: { value:1 },
  cr: { value:1 },
  cd: { value:15 },
};

export const statsFor = (mods: Stats[], from: Stats = { ...base }) => {
  mods.forEach(mod => {
    const [[k, { value }]] = Object.entries(mod);
    if (!from[k]) from[k] = { value:0 };
    from[k].value += value;
  });
  return from;
}