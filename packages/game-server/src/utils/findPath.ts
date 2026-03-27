export interface GridConfig {
  gridSize: number;
  width: number;
  depth: number;
  groundLevel: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  character: { height: number; radius: number };
  grid: boolean[][];
}

export interface GridPos {
  row: number;
  col: number;
}

export interface WorldPos {
  x: number;
  z: number;
}

interface Node {
  pos: GridPos;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export function worldToGrid(w: WorldPos, cfg: GridConfig): GridPos {
  return {
    row: Math.floor(w.z / cfg.gridSize),
    col: Math.floor(w.x / cfg.gridSize),
  };
}

export function gridToWorld(p: GridPos, cfg: GridConfig): WorldPos {
  return {
    x: (p.col + 0.5) * cfg.gridSize,
    z: (p.row + 0.5) * cfg.gridSize,
  };
}

function isWalkable(p: GridPos, cfg: GridConfig): boolean {
  if (p.row < 0 || p.row >= cfg.depth) return false;
  if (p.col < 0 || p.col >= cfg.width) return false;
  return cfg.grid[p.row][p.col] === true;
}

function key(p: GridPos): string {
  return `${p.row},${p.col}`;
}

function heuristic(a: GridPos, b: GridPos): number {
  const dx = Math.abs(a.col - b.col);
  const dz = Math.abs(a.row - b.row);
  return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
}

const DIRS: [number, number][] = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

function astar(start: GridPos, goal: GridPos, cfg: GridConfig): GridPos[] | null {
  const open: Node[] = [];
  const openMap = new Map<string, Node>();
  const closed = new Set<string>();

  const startNode: Node = {
    pos: start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  };
  open.push(startNode);
  openMap.set(key(start), startNode);

  while (open.length > 0) {
    let li = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[li].f) li = i;
    }
    const cur = open.splice(li, 1)[0];
    openMap.delete(key(cur.pos));
    closed.add(key(cur.pos));

    if (cur.pos.row === goal.row && cur.pos.col === goal.col) {
      const path: GridPos[] = [];
      let n: Node | null = cur;
      while (n) { path.unshift(n.pos); n = n.parent; }
      return path;
    }

    for (const [dr, dc] of DIRS) {
      const nb: GridPos = { row: cur.pos.row + dr, col: cur.pos.col + dc };
      if (!isWalkable(nb, cfg)) continue;
      if (closed.has(key(nb))) continue;

      const isDiag = dr !== 0 && dc !== 0;
      if (isDiag) {
        if (!isWalkable({ row: cur.pos.row, col: nb.col }, cfg)) continue;
        if (!isWalkable({ row: nb.row, col: cur.pos.col }, cfg)) continue;
      }

      const tentativeG = cur.g + (isDiag ? Math.SQRT2 : 1);
      const existing = openMap.get(key(nb));
      if (existing && tentativeG >= existing.g) continue;

      const h = heuristic(nb, goal);
      const node: Node = { pos: nb, g: tentativeG, h, f: tentativeG + h, parent: cur };

      if (existing) {
        const idx = open.indexOf(existing);
        if (idx !== -1) open.splice(idx, 1);
      }
      open.push(node);
      openMap.set(key(nb), node);
    }
  }

  return null;
}

export function findPath(
  start: WorldPos,
  goal: WorldPos,
  cfg: GridConfig 
): WorldPos[] | null {
  const startGrid = worldToGrid(start, cfg);
  const goalGrid  = worldToGrid(goal, cfg);

  if (!isWalkable(startGrid, cfg) || !isWalkable(goalGrid, cfg)) return null;

  const gridPath = astar(startGrid, goalGrid, cfg);
  if (!gridPath) return null;

  return gridPath.map(p => gridToWorld(p, cfg));
}