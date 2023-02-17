const SIZE = 28;

export type Hex = {q:number, r:number}

const axialDistance = (a:Hex, b:Hex):number =>
    (Math.abs(a.q - b.q)
    + Math.abs(a.q + a.r - b.q - b.r)
    + Math.abs(a.r - b.r)) / 2

const axialRound = (x:number, y:number): Hex => {
  const xGrid = Math.round(x), yGrid = Math.round(y);
  x -= xGrid; y -= yGrid; // remainder
  const dx = Math.round(x + 0.5*y) * (x*x >= y*y ? 1 : 0);
  const dy = Math.round(y + 0.5*x) * (x*x < y*y ? 1 : 0);
  return {q:xGrid + dx, r:yGrid + dy};
}

// pixelToPointyHex
export const from = (x:number, y:number, size=SIZE): Hex =>
  axialRound((Math.sqrt(3)/3*x - 1./3*y)/size, 2./3*y/size);

// pointyHexToPixel
export const toCenterPixel = ({q,r}: Hex, size=SIZE) =>
  ({x: size*(Math.sqrt(3)*q + Math.sqrt(3)/2*r), y: size*1.5*r});

export const sameCell = (h1, h2) => h1?.q === h2.q && h1?.r === h2.r;

export const vertexesFor = (x:number, y:number, size=SIZE) => [0,1,2,3,4,5].map(i => ({
  x: x + size * Math.cos(Math.PI / 180 * (60 * i - 30)),
  y: y + size * Math.sin(Math.PI / 180 * (60 * i - 30))
}));

const directions = [[-1,1],[-1,0],[0,-1],[1,-1],[1,0],[0,1]];

// https://www.redblobgames.com/pathfinding/a-star/introduction.html
const exploreFrontier = (start: Hex, goal: Hex, obstacles: Hex[]): {[p: string]: Hex}|null => {
  const frontier = [start];
  const cameFrom = {};
  const costSoFar = {[`${start.q}_${start.r}`]: 0};

  for (let count = 0; frontier.length > 0 && count < 1e4; count++) {
    /** @type Hex */ const current = frontier.shift();
    const neighbours = directions.map(d => ({q: current.q + d[0], r: current.r + d[1]}))
        .filter(n => !obstacles.some(o=> o.q===n.q && o.r===n.r))
        .sort((a, b) => axialDistance(goal, b) - axialDistance(goal, a));
    for (let next of neighbours) {
      const newCost = costSoFar[`${current.q}_${current.r}`] + 1 // graph.cost(current, next);
      const nextIdx = `${next.q}_${next.r}`;
      if (newCost >= costSoFar[nextIdx]) continue;
      costSoFar[nextIdx] = newCost;
      cameFrom[nextIdx] = current;
      // console.log([0, 1, 2, 3, 4, 5, 6, 7, 8].map(x => [0, 1, 2, 3, 4, 5].map(y =>
      //     /*`${x}_${y}:`+*/ String(costSoFar[`${x}_${y}`] ?? "-").padEnd(3)).join(" ")
      // ).join("\n"))
      if (next.q === goal.q && next.r === goal.r) return cameFrom;
      const priority = newCost + axialDistance(goal, next) // Math.abs(goal.q - next.q) + Math.abs(goal.r - next.r);
      const idx = frontier.findIndex(f => costSoFar[`${f.q}_${f.r}`] > priority);
      idx ? frontier.splice(idx - 1, 0, next) : frontier.push(next);
    }
  }
  return null;
}

export const omastar = (start: Hex, goal: Hex, obstacles: Hex[]=[]): Hex[] => {
  const cameFrom = exploreFrontier(start, goal, obstacles);
  const path = [];
  for (let n = goal; n !== start; n = cameFrom[`${n.q}_${n.r}`])
    path.unshift(n);
  return path;
}