const elementNames = ["anemo", "pyro", "hydro", "cryo", "electro", "geo", "dendro"] as const;

export const subStatNames = ["VIT", "STR", "DEF", "EM", "ER", "CD", "CR"] as const;
export type SubStatType = typeof subStatNames[number];

export const mainStatNames = [...subStatNames, "Healing", ...elementNames, "physical"] as const;
export type StatType = typeof mainStatNames[number];

type Stats = { [stat:number]: {value:number} }

type ArtifactType = "flower" | "plume" | "sands" | "goblet" | "circlet";

const mainStatPoolMap/*: { [art:ArtifactType]: StatType[] }*/ = {
  "flower": ["VIT"],
  "plume": ["STR"],
  "sands": ["STR", "VIT", "DEF"],
  "goblet": ["STR", "VIT", "DEF"],
  "circlet": ["STR", "VIT", "DEF", "CR", "CD"],
}

const generateArtifactMods = (type: ArtifactType, rng): Stats => {
  const mainStat = rng.get(mainStatPoolMap[type]);
  const substats
}