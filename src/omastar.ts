// https://www.redblobgames.com/pathfinding/a-star/introduction.html

/** @typedef {{q:number, r:number}} Hex */

const axialDistance = (a, b) =>
    (Math.abs(a.q - b.q)
    + Math.abs(a.q + a.r - b.q - b.r)
    + Math.abs(a.r - b.r)) / 2

const directions = [[-1,1],[-1,0],[0,-1],[1,-1],[1,0],[0,1]];

/**
 * @param {Hex} start
 * @param {Hex} goal
 * @param {Hex[]} obstacles
 * @returns {{[p: string]: Hex}|null}
 */
const exploreFrontier = (start, goal, obstacles) => {
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

/**
 * @param {Hex} start
 * @param {Hex} goal
 * @param {Hex[]} obstacles
 * @returns {Hex[]}
 */
export const omastar = (start, goal, obstacles=[]) => {
  const cameFrom = exploreFrontier(start, goal, obstacles);
  const path = [];
  for (let n = goal; n !== start; n = cameFrom[`${n.q}_${n.r}`])
    path.unshift(n);
  return path;
}