import * as PIXI from "pixi.js";
import * as hex from "./omastar";
import {OutlineFilter} from "@pixi/filter-outline";
import {equipTypeNames, Stats} from "./stats";

export const hudContainer = new PIXI.Container();

const hudHex = new PIXI.Graphics();
hudHex.beginFill(0x000000, .5)
  .drawPolygon(hex.vertexesFor({x:0, y:0}, 72))
  .endFill();
hudContainer.addChild(hudHex);

const hudPortraitContainer = new PIXI.Container();
hudContainer.addChild(hudPortraitContainer);

const hudHealthBar = new PIXI.Graphics();
hudContainer.addChild(hudHealthBar);
hudHealthBar.position = {x:-50, y:64};

const styly = new PIXI.TextStyle({fill:"#ffffff", fontSize:24, fontFamily: "ff6"});
const texty = new PIXI.Text("", styly);
texty.filters = [new OutlineFilter(2, 0x000000, .1, .6)];
texty.position = {x:-42, y:44};
hudContainer.addChild(texty);

const statsPanel = new PIXI.Container();
const statsPanelBg = new PIXI.Graphics();
statsPanelBg.beginFill(0x555500)
  .lineStyle(5, 0xFF0000)
  .drawRect(0, 0, 100, 140);
statsPanel.addChild(statsPanelBg);
hudContainer.addChild(statsPanel);
statsPanel.position = {x:80, y:-100};

const statsText = new PIXI.Text("", styly);
statsText.position = {x:5, y:5};
statsPanel.addChild(statsText);

export const inventoryPanel = new PIXI.Container();
const inventoryPanelBg = new PIXI.Graphics();
inventoryPanelBg.beginFill(0x555500)
  .lineStyle(5, 0xFF0000)
  .drawRect(0, 0, 220, 140);
inventoryPanel.addChild(inventoryPanelBg);
hudContainer.addChild(inventoryPanel);
inventoryPanel.position = {x:190, y:-100};

export const drawHealthBar = (stats: Stats, size=hex.SIZE/2) => hudHealthBar.clear()
  .lineStyle(6, 0x95d586, .8).lineTo(stats.hp.value * size, 0)
  .lineStyle(6, 0x888888, .8).lineTo(stats.vit.value * size, 0);

export const drawHud = (entity): void => {
  const avatar = entity.avatar;
  hudPortraitContainer.removeChildren();
  hudPortraitContainer.addChild(entity.hudPortrait);
  drawHealthBar(avatar.stats);
  texty.text = avatar.name;
  statsText.text = Object.entries(avatar.stats)
    .map(([k,v]: any[])=>`${k} ${v.value}`).join("\n").toUpperCase();
}

const modDisplayFor = mods => mods
  .filter(([_,v]: any[]) => v.value > 0)
  .map(([k,v]: any[]) => `${k} +${v.value}`).join("\n").toUpperCase();

const subStatsStyle = new PIXI.TextStyle({fill:"#ffffff", fontSize:16, fontFamily: "ff6"});

export const addEquip = (art, pos: number = equipTypeNames.indexOf(art.artifact.type)): void => {
  inventoryPanel.addChild(art.sprite);
  art.sprite.x = 20 + 100 * Math.floor(pos / 3);
  art.sprite.y = 20 + 50 * (pos % 3);
  const [main, ...sub] = Object.entries(art.artifact.mods);
  const statsText = new PIXI.Text(modDisplayFor([main]), styly);
  statsText.position = {x: 28 + art.sprite.x, y: art.sprite.y - 14};
  inventoryPanel.addChild(statsText);
  const subStatsText = new PIXI.Text(modDisplayFor(sub), subStatsStyle);
  subStatsText.position = {x: statsText.x, y: 20 + statsText.y};
  inventoryPanel.addChild(subStatsText);
}