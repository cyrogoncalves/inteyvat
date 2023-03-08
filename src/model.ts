export const SIZE = 28;

export type Hex = {q:number, r:number}

export const elementNames = ["anemo", "pyro", "hydro", "cryo", "electro", "geo", "dendro"] as const;

export const subStatNames = ["vit", "str", "def", "em", "er", "cd", "cr"] as const;
export type SubStatType = typeof subStatNames[number];

export const mainStatNames = [...subStatNames, "healing", ...elementNames, "physical"] as const;
export type StatType = typeof mainStatNames[number];

export type Stats = { [stat in string]: {value:number} }

export const equipTypeNames = ["weapon", "flower", "plume", "sands", "goblet", "circlet"] as const;
export type EquipType = typeof equipTypeNames[number];

export type Avatar = { name:string, stats:Stats, slug:string, equips:Equip[] }
export type Equip = { name:string, type:EquipType, mods:Stats }