import {OutlineFilter} from '@pixi/filter-outline';
import * as PIXI from "pixi.js";
import * as hex from "./omastar";
import * as hud from "./hud";
import * as stats from "./stats";


type Avatar = { name:string, stats:stats.Stats, slug:string }
export type HexGridEntity = { hex: hex.Hex, sprite: PIXI.Sprite, avatar?: Avatar, hudPortrait?: PIXI.Sprite, artifact? }


const avatars: Avatar[] = [
  { name: "Lanka", stats:{ hp: { value:10 }, ...stats.statsFor([]) }, slug: "lanka" },
  { name: "Tartaglia", stats:{ hp: { value:9 }, ...stats.statsFor([]) }, slug: "tartartaglia" },
  { name: "Zhongli", stats:{ hp: { value:8 }, ...stats.statsFor([]) }, slug: "morax" },
  { name: "Hu Tao", stats:{ hp: { value:7 }, ...stats.statsFor([]) }, slug: "walnut" },
]
const entities: HexGridEntity[] = [];
let cur = 0;
let moveCount = 0;
let path = null;
const loot = [];

let goal: hex.Hex = null;
let goalEntity: HexGridEntity = null;
let follow = false;
const enemies: HexGridEntity[] = [];


const app = new PIXI.Application({
  view: document.getElementById("pixi-hex-grid") as HTMLCanvasElement,
  width: 800, height: 600,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

const grid = app.stage.addChild(new PIXI.Container());
Object.assign(grid, { width:800, height:600 });
grid.interactive = true;
grid.hitArea = new PIXI.Rectangle(0, 0, 800, 600);

const gridOutline = grid.addChild(new PIXI.Graphics());
const realPath = grid.addChild(new PIXI.Graphics());
const curHexPath = grid.addChild(new PIXI.Graphics());
const healthBar = grid.addChild(new PIXI.Graphics());
const selectedHexPath = grid.addChild(new PIXI.Graphics());

const addToContainer = (it:HexGridEntity, scale=null) => {
  it.sprite.anchor.set(0.5);
  it.sprite.texture.baseTexture.on('loaded', () =>
    it.sprite.scale.set(scale || hex.SIZE * Math.sqrt(3) / it.sprite.height));
  grid.addChild(it.sprite);
  entities.push(it);
}

const team: HexGridEntity[] = avatars.map((avatar, i) => ({
  hex: { q:2+i, r:3 },
  avatar,
  sprite: PIXI.Sprite.from(`assets/${avatar.slug}.png`),
  hudPortrait: PIXI.Sprite.from(`assets/${avatar.slug}.png`)
}));
team.forEach(t => {
  t.hudPortrait.anchor.set(.5);
  t.hudPortrait.filters = [new OutlineFilter(3, 0xffffff)];
  t.sprite.rotation = 0.06;
  addToContainer(t)
});

[ // loot on map
  {hex:{q:8,r:5}, type:"flower", name:"Gladiator's Nostalgia.png"},
  {hex:{q:4,r:4}, type:"circlet", name:"Royal Masque.png"},
  {hex:{q:5,r:7}, type:"circlet", name:"Royal Masque.png"},
  {hex:{q:9,r:7}, type:"circlet", name:"Royal Masque.png"},
  {hex:{q:1,r:9}, type:"plume", name:"Viridescent Arrow Feather.png"},
].forEach(({hex, type, name}) => addToContainer(({
  hex,
  artifact: {name, type, mods: stats.generateArtifactMods(type as stats.EquipType)},
  sprite: PIXI.Sprite.from(`./assets/${name}`)
})));

for (let i = 0; i < 5; i++) {
  const hilixu = {
    hex: {q:9-i,r:5+(i*4)%9},
    sprite: PIXI.Sprite.from("./assets/hilixu.png")
  };
  hilixu.sprite.rotation = 0.06
  hilixu.sprite.tint = 0x89da86;
  enemies.push(hilixu);
  addToContainer(hilixu)
}

const draw = {
  hex: (path: PIXI.Graphics, point: PIXI.IPointData = {x:0, y:0}, color: number = 0xFFFFFF) => {
    const points = hex.vertexesFor(point);
    path.clear().lineStyle(3, color, .4).moveTo(points[5].x, points[5].y);
    points.forEach(p => path.lineTo(p.x, p.y));
  },
  path: (path: hex.Hex[], realPath: PIXI.Graphics, {x,y}: PIXI.IPointData) => {
    // TODO make path prettier
    realPath.clear().lineStyle(2, 0xFFFFFF).moveTo(x, y);
    path.map(p => hex.toCenterPixel(p)).forEach(p => realPath.lineTo(p.x, p.y));
  },
  outline: () => {
    gridOutline.lineStyle(2, 0xFFFFFF, .1);
    for (let q = 0; q < 17; q++) {
      for (let r = 0; r < 15; r++) {
        const v = hex.vertexesFor(hex.toCenterPixel({q: q - (r - (r & 1)) / 2, r}));
        gridOutline.moveTo(v[5].x, v[5].y).lineTo(v[0].x, v[0].y)
          .lineTo(v[1].x, v[1].y).lineTo(v[2].x, v[2].y);
      }
    }
  },
  healthBar(bar:PIXI.Graphics, entity:HexGridEntity) {
    const stats = entity.avatar.stats;
    const x = -28*.6 + stats.hp.value / stats.vit.value * 28*2*.6;
    bar.clear().moveTo(-28*.6, 28)
      .lineStyle(4, 0x95d586, .8).lineTo(x, 28)
      .lineStyle(4, 0x888888, .8).lineTo(28*.6, 28);
  },
  updatePos: (it) => {
    it.forEach(t => t.sprite.position = hex.toCenterPixel(t.hex));
    curHexPath.position = team[cur].sprite
    healthBar.position = team[cur].sprite;
  }
}

draw.outline();
draw.hex(curHexPath);
draw.healthBar(healthBar, team[cur]);
draw.updatePos(entities);

app.stage.addChild(hud.hudContainer);
hud.hudContainer.position = {x:100, y:500};
hud.drawHud(team[cur]);

grid.on('pointerdown', ev => {
  const newGoal = hex.from(ev.data.x, ev.data.y);
  const charIdx = team.findIndex(it => hex.sameCell(newGoal, it.hex));
  // console.log("click", { cur, charIdx, goalEntity });

  if (charIdx === cur)
    return hud.toggleHud();
  else if (charIdx >= 0)
    return changeSelectedChar(charIdx);
  else if (hex.sameCell(goal, newGoal))
    return (follow = true); // second click on goal

  goal = newGoal;
  goalEntity = entities.find(it => hex.sameCell(goal, it.hex));
  const obstacles = entities.filter(it=>it!==goalEntity).map(t=>t.hex);
  path = hex.omastar(team[cur].hex, goal, obstacles);
  const color = goalEntity ? 0xFF6666 : 0xFFFF66;
  draw.hex(selectedHexPath, hex.toCenterPixel(goal), color);
  draw.path(path, realPath, team[cur].sprite);
});

const changeSelectedChar = (charIdx) => {
  cur = charIdx;
  curHexPath.position = team[cur].sprite;
  draw.healthBar(healthBar, team[cur]);
  healthBar.position = team[cur].sprite;
  goalEntity = null;
  selectedHexPath.clear();
  realPath.clear();
  hud.drawHud(team[cur]);
}

function fight() {
  console.log("fight!");
  grid.removeChild(goalEntity.sprite);
  team[cur].avatar.stats.hp.value -= 4;
  draw.healthBar(healthBar, team[cur]);
  hud.drawHud(team[cur]);
  realPath.clear();
}

function pick() {
  loot.push(goalEntity);
  entities.splice(entities.findIndex(it => hex.sameCell(it.hex, goalEntity.hex)), 1);
  console.log("pick!", loot);
  grid.removeChild(goalEntity.sprite);
  hud.addEquip(goalEntity);
  team[cur].avatar.stats = stats.statsFor([goalEntity.artifact.mods], team[cur].avatar.stats);
  hud.drawHud(team[cur]);
  // updatePos(loot);
  realPath.clear();
}

const tickers = [
  {elapsed:0.0, speed:60, fn:()=>entities.forEach(t => t.sprite.rotation = -t.sprite.rotation)},
  {elapsed:0.0, speed:20, fn:()=>{
      if (!follow) return;
      const step = path.shift();
      if (!hex.sameCell(goalEntity?.hex, step)) {
        move(step, team);
        draw.path(path, realPath, team[cur].sprite);
        if (path.length !== 0) return;
      } else if (enemies.includes(goalEntity)) {
        fight();
      } else {
        pick();
      }
      selectedHexPath.clear();
      follow = false;
    }},
]
app.ticker.add(delta => tickers.forEach(t=>{
  if (t.elapsed + delta > t.speed) t.fn()
  t.elapsed = (t.elapsed + delta) % t.speed;
}));

const exchangePlaces = (team: HexGridEntity[], idx: number, hex0: hex.Hex): void => {
  team[idx].hex = hex0;
  [team[idx], team[cur]] = [team[cur], team[idx]];
  cur = idx;
  draw.updatePos(team);
}
const move = (goal: hex.Hex, team: HexGridEntity[]): void => {
  let hex0 = team[cur].hex;
  team[cur].hex = goal;

  const idx = team.findIndex(c=>c!==team[cur] && hex.sameCell(c.hex, team[cur].hex));
  if (idx > 0) return exchangePlaces(team, idx, hex0) // if the hex already had a unit, just exchange places

  const slices = [team.slice(0, cur).reverse(), team.slice(cur+1)]
    .sort((a,b)=>a.length-b.length);
  if (slices[0].length) // if it's in the middle of the line, just exchange places
    return exchangePlaces(team, team.findIndex(c=>c===slices[0][0]), hex0);
  slices[1].forEach(c=> [c.hex, hex0] = [hex0, c.hex]);
  draw.updatePos(team);

  document.getElementById("moves").innerHTML = String(++moveCount);
}

const moveMap = { "w":[0, -1], "e":[1, -1], "d":[1, 0], "x":[0, 1], "z":[-1, 1], "a":[-1, 0] };
window.addEventListener("keydown", event => {
  const delta = moveMap[event.key]
  if (delta) move({q:team[cur].hex.q + delta[0], r:team[cur].hex.r + delta[1]}, team);
}, false);
