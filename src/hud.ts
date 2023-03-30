import * as PIXI from "pixi.js";
import * as hex from "./omastar";
import {OutlineFilter} from "@pixi/filter-outline";
import {equipTypeNames, SIZE, Stats} from "./model";

export const hudContainer = new PIXI.Container();

const hudHex = hudContainer.addChild(new PIXI.Graphics());
hudHex.beginFill(0x000000, .5)
  .drawPolygon(hex.vertexes(72)).endFill();

const peek = (element, fn) => { fn(element); return element; }

const portraits = {};
const hudPortraitContainer = hudContainer.addChild(new PIXI.Container());
const updatePortrait = (slug:string):void => {
  portraits[slug] ??= peek(PIXI.Sprite.from(`assets/${slug}.png`), portrait => {
    portrait.anchor.set(.5);
    portrait.filters = [new OutlineFilter(3, 0xffffff)];
  });
  hudPortraitContainer.removeChildren();
  hudPortraitContainer.addChild(portraits[slug]);
}

const hudHealthBar = hudContainer.addChild(new PIXI.Graphics());
hudHealthBar.position = {x:-50, y:64};
export const drawHealthBar = (stats: Stats, size=SIZE/2) => hudHealthBar.clear()
  .lineStyle(6, 0x95d586, .8).lineTo(stats.hp.value * size, 0)
  .lineStyle(6, 0x888888, .8).lineTo(stats.vit.value * size, 0);

const styly = new PIXI.TextStyle({fill:"#ffffff", fontSize:24, fontFamily: "ff6"});
const statStyle = new PIXI.TextStyle({fill:"#ffffff", fontSize:18, fontFamily: "ff6"});
const mainStatStyle = new PIXI.TextStyle({fill:"#ffffff", fontSize:21, fontFamily: "ff6"});
const subStatsStyle = new PIXI.TextStyle({fill:"#ffffff", fontSize:16, fontFamily: "ff6"});

const name = hudContainer.addChild(new PIXI.Text("", styly));
name.filters = [new OutlineFilter(2, 0x000000, .1, .6)];
name.position = {x:-42, y:44};

const statsPanel = hudContainer.addChild(new PIXI.Container());
const statsPanelBg = statsPanel.addChild(new PIXI.Graphics());
statsPanelBg.beginFill(0x225522)
  .lineStyle(5, 0x336633)
  .drawRect(0, 0, 100, 140);
statsPanel.position = {x:80, y:-100};
const statsText = statsPanel.addChild(new PIXI.Text("", statStyle));
statsText.position = {x:5, y:5};

const drawInventoryPanel = (color1, color2) => {
  const panel = new PIXI.Container();
  const bg = panel.addChild(new PIXI.Graphics());
  bg.beginFill(color1).drawRect(0, 0, 225, 170);
  bg.beginFill(color2);
  for (let i = 0; i < 6; i++)
    bg.drawRect(Math.floor(i/3)*110+5, (i%3)*55+5, 105, 50);
  panel.position = {x:190, y:-130};
  return panel;
}
const inventoryPanel = drawInventoryPanel(0x336633, 0x225522);
hudContainer.addChild(inventoryPanel);

const loadSprite = (slug:string, scale=null):PIXI.Sprite => {
  const sprite = PIXI.Sprite.from(`./assets/${slug}`);
  sprite.scale.set(scale || SIZE * Math.sqrt(3) / sprite.height);
  return sprite;
}
const sprites = {};
export const drawHud = (avatar): void => {
  updatePortrait(avatar.slug);
  name.text = avatar.name;
  updateStats(avatar.stats);
  if (inventoryPanel.children.length > 1)
    inventoryPanel.removeChildren(1);
  equipTypeNames.forEach((type, i) => {
    const equip = avatar.equips.find(it => it.type === type);
    if (!equip) return;
    const sprite = sprites[equip.name] ??= loadSprite(equip.name);
    sprite.position = {x:Math.floor(i/3)*110+5, y:(i%3)*55+5};
    const statsText = new PIXI.Text(modDisplayFor([equip.mods[0]]), mainStatStyle);
    statsText.position = {x: sprite.x + 50, y: sprite.y};
    const subStatsText = new PIXI.Text(modDisplayFor(equip.mods.slice(1)), subStatsStyle);
    subStatsText.position = {x: statsText.x, y: 20 + statsText.y};
    inventoryPanel.addChild(sprite, statsText, subStatsText);
  })
}

export const updateStats = (stats) => {
  drawHealthBar(stats);
  statsText.text = Object.entries(stats)
    .map(([k,v]: any[])=>`${k} ${v.value}`).join("\n").toUpperCase();
}

const modDisplayFor = mods => mods.filter(({value}) => value)
  .map(({type, value}) => `${type} +${value}`).join("\n").toUpperCase();

const backpackPanel = hudContainer.addChild(new PIXI.Container());
backpackPanel.position = {x:-80, y:-200};
backpackPanel.addChild(new PIXI.Graphics().beginFill(0x225522)
  .lineStyle(5, 0x336633).drawRect(0, 0, 300, 50));
export function addToBackpack(art/*: HexGridEntity*/) {
  art.sprite.position = { x:-40 + 60 * backpackPanel.children.length, y: 20 };
  backpackPanel.addChild(art.sprite);
}

export const toggleHud = () => {
  statsPanel.visible = !statsPanel.visible
  inventoryPanel.visible = !inventoryPanel.visible
  backpackPanel.visible = !backpackPanel.visible
}