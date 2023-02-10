import * as PIXI from "pixi.js";
import {Hex, omastar} from "./omastar";

type AvatarEntity = { hex: {q:number, r:number}, sprite: PIXI.Sprite, x:number, y:number }

const SIZE = 28;

const axialRound = (x, y) => {
  const xGrid = Math.round(x), yGrid = Math.round(y);
  x -= xGrid; y -= yGrid; // remainder
  const dx = Math.round(x + 0.5*y) * (x*x >= y*y ? 1 : 0);
  const dy = Math.round(y + 0.5*x) * (x*x < y*y ? 1 : 0);
  return {q:xGrid + dx, r:yGrid + dy};
}

const pixelToPointyHex = (x, y) => axialRound((Math.sqrt(3)/3*x - 1./3*y)/SIZE, 2./3*y/SIZE);

const pointyHexToPixel = ({q,r}) => ({x: SIZE*(Math.sqrt(3)*q + Math.sqrt(3)/2*r), y: SIZE*1.5*r});

const sameHex = (h1, h2) => h1?.q === h2.q && h1?.r === h2.r;

const drawHex = (path, { x, y }: {x:number, y:number}, color: number = 0xFFFFFF, size: number = SIZE) => {
  const points = [0,1,2,3,4,5].map(i => ({
    x: x + size * Math.cos(Math.PI / 180 * (60 * i - 30)),
    y: y + size * Math.sin(Math.PI / 180 * (60 * i - 30))
  }));
  path.clear().lineStyle(3, color, .2).moveTo(points[5].x, points[5].y);
  points.forEach(p => path.lineTo(p.x, p.y));
}


const app = new PIXI.Application({ width: 1000, height: 600,
  backgroundColor: 0x1099bb, resolution: window.devicePixelRatio || 1 });
// @ts-ignore TODO
document.body.prepend(app.view);

const container = new PIXI.Container();
Object.assign(container, { width:800, height:600 });
app.stage.addChild(container);
container.interactive = true;
container.hitArea = new PIXI.Rectangle(0, 0, 800, 600);

const inventory = new PIXI.Container();
Object.assign(inventory, { width:200, height:600, x:800, y:0 });
app.stage.addChild(inventory);

const selectedHexPath = new PIXI.Graphics();
app.stage.addChild(selectedHexPath);

const realPath = new PIXI.Graphics();
container.addChild(realPath)
let path = null;
let goal = null;
let follow = false;
let goalEntity = null;
let moveCount = 0;
container.on('pointerdown', ev => {
  const newGoal = pixelToPointyHex(ev.data.global.x, ev.data.global.y);
  if (sameHex(goal, newGoal)) return (follow = true); // second click on goal
  goal = newGoal;
  if (team.some(t => sameHex(goal, t.hex))) return; // clicked on a char

  goalEntity = entities.find(it => sameHex(goal, it.hex));
  const color = goalEntity ? 0xFF6666 : 0xFFFF66;
  drawHex(selectedHexPath, pointyHexToPixel(goal), color);
  path = omastar(team[cur].hex, goal, entities.map(t=>t.hex).filter(it=>!sameHex(it, goal)));
  drawPath(path, realPath)
});
const drawPath = (path, realPath, {x,y}=team[cur]) => {
  realPath.clear().lineStyle(2, 0xFFFFFF, 1).moveTo(x, y);
  path.map(p => pointyHexToPixel(p)).forEach(p => realPath.lineTo(p.x, p.y));
}

const entities = [];
const addToContainer = (it, scale = 0.5) => {
  Object.assign(it.sprite, { interactive:true });
  it.sprite.anchor.set(0.5);
  it.sprite.scale.set(scale);
  container.addChild(it.sprite);
  entities.push(it);
}
const newEntity = (hex: Hex, sourceImg: string): AvatarEntity => ({
  hex,
  sprite: new PIXI.Sprite(PIXI.Texture.from(sourceImg)),
  get x() { return this.sprite.x },
  get y() { return this.sprite.y }
})

let cur = 0;
const team: AvatarEntity[] = ["lanka.png", "tartartaglia.png", "morax.png", "walnut.png"]
  .map((n, i) => newEntity({ q:i+2, r:3 }, `assets/${n}`));
team.forEach(t => {
  t.sprite.rotation = 0.06;
  t.sprite.on('pointerdown', () => {
    cur = team.findIndex(c => c === t);
    goal = null;
    selectedHexPath.clear();
    realPath.clear();
    drawHex(curHexPath, team[cur]);
  });
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

const updatePos = (it) => it.forEach(t => {
  const point = pointyHexToPixel(t.hex);
  [t.sprite.x, t.sprite.y] = [point.x, point.y];
})
updatePos(entities);
const curHexPath = new PIXI.Graphics();
app.stage.addChild(curHexPath);
drawHex(curHexPath, team[cur]);

const loot = [];

const tickers = [
  {elapsed:0.0, speed:60, fn:()=>team.forEach(t => t.sprite.rotation = -t.sprite.rotation)},
  {elapsed:0.0, speed:20, fn:()=>{
      if (!follow) return;
      const step = path.shift();
      if (!sameHex(goalEntity?.hex, step)) {
        move(step, team);
        drawPath(path, realPath);
        if (path.length !== 0) return;
      } else {
        loot.push(goalEntity);
        entities.splice(entities.findIndex(it=>sameHex(it.hex, goalEntity.hex)), 1);
        console.log("pick!", entities);
        container.removeChild(goalEntity.sprite);
        inventory.addChild(goalEntity.sprite);
        [goalEntity.hex.q, goalEntity.hex.r] = [1 + loot.length%2, 1 + Math.floor(loot.length/2)];
        updatePos(loot);
        realPath.clear();
      }
      selectedHexPath.clear();
      follow = false;
    }},
]
app.ticker.add(delta => tickers.forEach(t=>{
  t.elapsed += delta;
  if (t.elapsed > t.speed) { t.fn(); t.elapsed = 0.0; }
}));

const exchangePlaces = (team: AvatarEntity[], idx: number, pos0q: number, pos0r: number): void => {
  [team[idx].hex.q, team[idx].hex.r] = [pos0q, pos0r];
  [team[idx], team[cur]] = [team[cur], team[idx]];
  cur = idx;
}

const move = ({q, r}: Hex, team: AvatarEntity[]): void => {
  let [pos0q, pos0r] = [team[cur].hex.q, team[cur].hex.r];
  team[cur].hex = {q:q, r:r};

  const idx = team.findIndex(c=>c!==team[cur] && sameHex(c.hex, team[cur].hex));
  if (idx > 0) return exchangePlaces(team, idx, pos0q, pos0r) // if the hex already had a unit, just exchange places

  const slices = [team.slice(0, cur).reverse(), team.slice(cur+1)]
    .sort((a,b)=>a.length-b.length);
  if (slices[0].length) // if it's in the middle of the line, also just exchange places
    return exchangePlaces(team, team.findIndex(c=>c===slices[0][0]), pos0q, pos0r);
  slices[1].forEach(c=> [c.hex.q, c.hex.r, pos0q, pos0r] = [pos0q, pos0r, c.hex.q, c.hex.r]);
  updatePos(team);
  drawHex(curHexPath, team[cur]);

  document.getElementById("moves").innerHTML = String(++moveCount);
}

const moveMap = { "w":[0, -1], "e":[1, -1], "d":[1, 0], "x":[0, 1], "z":[-1, 1], "a":[-1, 0] };
window.addEventListener("keydown", event => {
  const delta = moveMap[event.key]
  if (delta) move({q:team[cur].hex.q + delta[0], r:team[cur].hex.r + delta[1]}, team);
}, false);

// TODO make path prettier