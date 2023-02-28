const elementNames = ["anemo", "pyro", "hydro", "cryo", "electro", "geo", "dendro"] as const;

export const subStatNames = ["VIT", "STR", "DEF", "EM", "ER", "CD", "CR"] as const;
export type SubStatType = typeof subStatNames[number];

export const mainStatNames = [...subStatNames, "Healing", ...elementNames, "physical"] as const;
export type StatType = typeof mainStatNames[number];

type Stats = { [stat:number]: {value:number} }

const artifactTypeNames = ["flower", "plume", "sands", "goblet", "circlet"] as const;
type ArtifactType = typeof artifactTypeNames[number];

const mainStatPoolMap: { [art in ArtifactType]: StatType[] } = {
  "flower": ["VIT"],
  "plume": ["STR"],
  "sands": ["STR", "VIT", "DEF", "EM", "ER"],
  "goblet": ["STR", "VIT", "DEF", "EM", ...elementNames, "physical"],
  "circlet": ["STR", "VIT", "DEF", "EM", "CR", "CD"],
}

const RNG = {
  select: (arr) => arr[Math.floor(Math.random()*arr.length)]
}

// export const generateArtifact = (type: ArtifactType, rng=RNG)

export const generateArtifactMods = (
  type: ArtifactType,
  rng=RNG
): Stats => ({
  [rng.select(mainStatPoolMap[type])]: {value: 1},
  [rng.select(subStatNames)]: {value: 0},
  [rng.select(subStatNames)]: {value: 0},
})
