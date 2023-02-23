import * as PIXI from "pixi.js";
import * as hex from "./omastar";
import {vertexesFor} from "./omastar";

type Stats = { hp:number, endurance:number }
export type HexGridEntity = { hex: hex.Hex, sprite: PIXI.Sprite, stats: Stats }

const drawHex = (path: PIXI.Graphics, point: PIXI.IPointData = {x:0, y:0}, color: number = 0xFFFFFF) => {
  const points = hex.vertexesFor(point);
  path.clear().lineStyle(3, color, .4).moveTo(points[5].x, points[5].y);
  points.forEach(p => path.lineTo(p.x, p.y));
}

const drawPath = (path: hex.Hex[], realPath: PIXI.Graphics, {x,y}: PIXI.IPointData) => {
  realPath.clear().lineStyle(2, 0xFFFFFF).moveTo(x, y);
  path.map(p => hex.toCenterPixel(p)).forEach(p => realPath.lineTo(p.x, p.y));
}

const app = new PIXI.Application({
  view: document.getElementById("pixi-hex-grid") as HTMLCanvasElement,
  width: 1000, height: 600,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

const container = new PIXI.Container();
Object.assign(container, { width:800, height:600 });
app.stage.addChild(container);
container.interactive = true;
container.hitArea = new PIXI.Rectangle(0, 0, 800, 600);

const gridOutline = new PIXI.Graphics();
gridOutline.lineStyle(2, 0xFFFFFF, .1);
container.addChild(gridOutline);
for (let q = 0; q < 17; q++) {
  for (let r = 0; r < 15; r++) {
    const v = vertexesFor(hex.toCenterPixel({q: q - (r - (r & 1)) / 2, r}));
    gridOutline.moveTo(v[5].x, v[5].y).lineTo(v[0].x, v[0].y)
      .lineTo(v[1].x, v[1].y).lineTo(v[2].x, v[2].y);
  }
}

const inventory = new PIXI.Container();
Object.assign(inventory, { x:800, y:0, width:200, height:600 });
app.stage.addChild(inventory);
inventory.interactive = true;
inventory.hitArea = new PIXI.Rectangle(0, 0, 200, 600);
inventory.on('pointerdown', ev => {
  console.log(`Inventory click! x:${ev.data.x} y:${ev.data.y}`);
})

let path = null;
const realPath = new PIXI.Graphics();
container.addChild(realPath);

let cur = 0;
const curHexPath = new PIXI.Graphics();
drawHex(curHexPath);
container.addChild(curHexPath);

const healthBar = new PIXI.Graphics();
container.addChild(healthBar);
const drawHealthBar = (healthBar, entity:HexGridEntity) => {
  const x = -28*.6 + entity.stats.hp / entity.stats.endurance * 28*2*.6;
  healthBar.clear().moveTo(-28*.6, 28)
    .lineStyle(4, 0x95d586, .8).lineTo(x, 28)
    .lineStyle(4, 0x888888, .8).lineTo(28*.6, 28);
}

let goal: hex.Hex = null;
let goalEntity: HexGridEntity = null;
let follow = false;
const selectedHexPath = new PIXI.Graphics();
container.addChild(selectedHexPath);

let moveCount = 0;

container.on('pointerdown', ev => {
  const newGoal = hex.from(ev.data.x, ev.data.y);
  if (hex.sameCell(goal, newGoal)) return (follow = true); // second click on goal
  goal = newGoal;
  goalEntity = entities.find(it => hex.sameCell(goal, it.hex));

  if (team.includes(goalEntity)) { // clicked on a char
    cur = team.findIndex(c => c === goalEntity);
    curHexPath.position = team[cur].sprite;
    drawHealthBar(healthBar, team[cur]);
    healthBar.position = team[cur].sprite;
    goalEntity = null;
    selectedHexPath.clear();
    realPath.clear();
    return;
  }

  const obstacles = entities.filter(it=>it!==goalEntity).map(t=>t.hex);
  path = hex.omastar(team[cur].hex, goal, obstacles);

  const color = goalEntity ? 0xFF6666 : 0xFFFF66;
  drawHex(selectedHexPath, hex.toCenterPixel(goal), color);
  drawPath(path, realPath, team[cur].sprite);
});

const entities: HexGridEntity[] = [];
const addToContainer = (it, scale=null) => {
  it.sprite.anchor.set(0.5);
  it.sprite.texture.baseTexture.on('loaded', () =>
    it.sprite.scale.set(scale || hex.SIZE * Math.sqrt(3) / it.sprite.height));
  container.addChild(it.sprite);
  entities.push(it);
}

const newEntity = (hex: hex.Hex, sourceImg: string): HexGridEntity => ({
  hex,
  stats: { hp:10, endurance:10 },
  sprite: PIXI.Sprite.from(sourceImg)
})

const team: HexGridEntity[] = [
  { hex: { q:2, r:3 }, stats:{ hp:10, endurance:10 }, sprite: PIXI.Sprite.from("assets/lanka.png") },
  { hex: { q:3, r:3 }, stats:{ hp:9, endurance:10 }, sprite: PIXI.Sprite.from("assets/tartartaglia.png") },
  { hex: { q:4, r:3 }, stats:{ hp:8, endurance:10 }, sprite: PIXI.Sprite.from("assets/morax.png") },
  { hex: { q:5, r:3 }, stats:{ hp:7, endurance:10 }, sprite: PIXI.Sprite.from("assets/walnut.png") },
];
team.forEach(t => {
  t.sprite.rotation = 0.06;
  addToContainer(t)
});
drawHealthBar(healthBar, team[cur]);

[ // loot on map
  {hex: {q:8,r:5}, name:"Gladiator's Nostalgia.png"},
  {hex: {q:5,r:6}, name:"Royal Masque.png"},
  {hex: {q:5,r:7}, name:"Royal Masque.png"},
  {hex: {q:9,r:7}, name:"Royal Masque.png"},
  {hex: {q:1,r:9}, name:"Viridescent Arrow Feather.png"},
].map(({hex, name}) =>
  newEntity(hex, `./assets/${name}`))
  .forEach(it => addToContainer(it));

// enemies
const enemies: HexGridEntity[] = [];
for (let i = 0; i < 5; i++) {
  const hilixu = newEntity({q:9-i,r:5+(i*4)%9}, `./assets/hilixu.png`);
  hilixu.sprite.rotation = 0.06
  hilixu.sprite.tint = 0x89da86;
  enemies.push(hilixu);
  addToContainer(hilixu)
}

const loot = [];

const updatePos = (it) => {
  it.forEach(t => t.sprite.position = hex.toCenterPixel(t.hex));
  curHexPath.position = team[cur].sprite
  healthBar.position = team[cur].sprite;
}
updatePos(entities);


const tickers = [
  {elapsed:0.0, speed:60, fn:()=>entities.forEach(t => t.sprite.rotation = -t.sprite.rotation)},
  {elapsed:0.0, speed:20, fn:()=>{
      if (!follow) return;
      const step = path.shift();
      if (!hex.sameCell(goalEntity?.hex, step)) {
        move(step, team);
        drawPath(path, realPath, team[cur].sprite);
        if (path.length !== 0) return;
      } else if (enemies.includes(goalEntity)) {
        console.log("fight!");
        container.removeChild(goalEntity.sprite);
        team[cur].stats.hp -= 4;
        drawHealthBar(healthBar, team[cur]);
        realPath.clear();
      } else {
        loot.push(goalEntity);
        entities.splice(entities.findIndex(it=>hex.sameCell(it.hex, goalEntity.hex)), 1);
        console.log("pick!", entities);
        container.removeChild(goalEntity.sprite);
        inventory.addChild(goalEntity.sprite);
        goalEntity.hex.q = 1 + loot.length%2;
        goalEntity.hex.r = 1 + Math.floor(loot.length/2);
        updatePos(loot);
        realPath.clear();
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
  updatePos(team);
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
  updatePos(team);

  document.getElementById("moves").innerHTML = String(++moveCount);
}

const moveMap = { "w":[0, -1], "e":[1, -1], "d":[1, 0], "x":[0, 1], "z":[-1, 1], "a":[-1, 0] };
window.addEventListener("keydown", event => {
  const delta = moveMap[event.key]
  if (delta) move({q:team[cur].hex.q + delta[0], r:team[cur].hex.r + delta[1]}, team);
}, false);

// TODO make path prettier