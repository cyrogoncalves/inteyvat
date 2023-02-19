import * as PIXI from "pixi.js";
import * as hex from "./omastar";

export type HexGridEntity = { hex: {q:number, r:number}, sprite: PIXI.Sprite, x:number, y:number }

const drawHex = (path, { x, y }: {x:number, y:number} = {x:0, y:0}, color: number = 0xFFFFFF) => {
  const points = hex.vertexesFor(x, y);
  path.clear().lineStyle(3, color, .2).moveTo(points[5].x, points[5].y);
  points.forEach(p => path.lineTo(p.x, p.y));
}

const drawPath = (path, realPath, {x,y}: {x:number, y:number}) => {
  realPath.clear().lineStyle(2, 0xFFFFFF, 1).moveTo(x, y);
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

let goal = null;
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
    [curHexPath.x, curHexPath.y] = [team[cur].x, team[cur].y];
    goalEntity = null;
    selectedHexPath.clear();
    realPath.clear();
    return;
  }

  const obstacles = entities.filter(it=>it!==goalEntity).map(t=>t.hex);
  path = hex.omastar(team[cur].hex, goal, obstacles);

  const color = goalEntity ? 0xFF6666 : 0xFFFF66;
  drawHex(selectedHexPath, hex.toCenterPixel(goal), color);
  drawPath(path, realPath, team[cur]);
});

const entities: HexGridEntity[] = [];
const addToContainer = (it, scale = 0.5) => {
  Object.assign(it.sprite, { interactive:true });
  it.sprite.anchor.set(0.5);
  it.sprite.scale.set(scale);
  container.addChild(it.sprite);
  entities.push(it);
}

const newEntity = (hex: hex.Hex, sourceImg: string): HexGridEntity => ({
  hex,
  sprite: PIXI.Sprite.from(sourceImg),
  get x() { return this.sprite.x },
  get y() { return this.sprite.y }
})

const team: HexGridEntity[] = ["lanka.png", "tartartaglia.png", "morax.png", "walnut.png"]
  .map((n, i) => newEntity({ q:i+2, r:3 }, `assets/${n}`));
team.forEach(t => {
  t.sprite.rotation = 0.06;
  addToContainer(t)
});

[ // loot on map
  {hex: {q:8,r:5}, name:"Gladiator's Nostalgia.png"},
  {hex: {q:5,r:6}, name:"Royal Masque.png"},
  {hex: {q:5,r:7}, name:"Royal Masque.png"},
  {hex: {q:9,r:7}, name:"Royal Masque.png"},
  {hex: {q:1,r:9}, name:"Viridescent Arrow Feather.png"},
].map(({hex, name}) =>
  newEntity(hex, `./assets/${name}`))
  .forEach(it => addToContainer(it, 0.25));

// enemies
const enemies: HexGridEntity[] = [];
const hilixu = newEntity({q:8,r:8}, `./assets/hilixu.png`);
hilixu.sprite.rotation = 0.06
enemies.push(hilixu);
addToContainer(hilixu, 0.15)

const loot = [];

const updatePos = (it) => it.forEach(t => {
  const point = hex.toCenterPixel(t.hex);
  [t.sprite.x, t.sprite.y] = [point.x, point.y];
  [curHexPath.x, curHexPath.y] = [team[cur].x, team[cur].y];
})
updatePos(entities);


const tickers = [
  {elapsed:0.0, speed:60, fn:()=>entities.forEach(t => t.sprite.rotation = -t.sprite.rotation)},
  {elapsed:0.0, speed:20, fn:()=>{
      if (!follow) return;
      const step = path.shift();
      if (!hex.sameCell(goalEntity?.hex, step)) {
        move(step, team);
        drawPath(path, realPath, team[cur]);
        if (path.length !== 0) return;
      } else if (enemies.includes(goalEntity)) {
        console.log("fight!");
        container.removeChild(goalEntity.sprite);
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

const exchangePlaces = (team: HexGridEntity[], idx: number, pos0q: number, pos0r: number): void => {
  [team[idx].hex.q, team[idx].hex.r] = [pos0q, pos0r];
  [team[idx], team[cur]] = [team[cur], team[idx]];
  cur = idx;
  updatePos(team);
}

const move = ({q, r}: hex.Hex, team: HexGridEntity[]): void => {
  let [pos0q, pos0r] = [team[cur].hex.q, team[cur].hex.r];
  team[cur].hex = {q, r};

  const idx = team.findIndex(c=>c!==team[cur] && hex.sameCell(c.hex, team[cur].hex));
  if (idx > 0) return exchangePlaces(team, idx, pos0q, pos0r) // if the hex already had a unit, just exchange places

  const slices = [team.slice(0, cur).reverse(), team.slice(cur+1)]
    .sort((a,b)=>a.length-b.length);
  if (slices[0].length) // if it's in the middle of the line, just exchange places
    return exchangePlaces(team, team.findIndex(c=>c===slices[0][0]), pos0q, pos0r);
  slices[1].forEach(c=> [c.hex.q, c.hex.r, pos0q, pos0r] = [pos0q, pos0r, c.hex.q, c.hex.r]);
  updatePos(team);

  document.getElementById("moves").innerHTML = String(++moveCount);
}

const moveMap = { "w":[0, -1], "e":[1, -1], "d":[1, 0], "x":[0, 1], "z":[-1, 1], "a":[-1, 0] };
window.addEventListener("keydown", event => {
  const delta = moveMap[event.key]
  if (delta) move({q:team[cur].hex.q + delta[0], r:team[cur].hex.r + delta[1]}, team);
}, false);

// TODO make path prettier