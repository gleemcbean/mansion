import { M_GRID_SIZE } from "@mansion/shared/constants/map";
import type { Vec2 } from "@mansion/shared/types/util";
import { astar } from "./astar";
import isWalkable, { type Grid, gridToWorld, worldToGrid } from "./grid";

export interface PathResult {
	waypoints: Vec2[];
	replanThresholdSq: number;
}

function hasLineOfSight(a: Vec2, b: Vec2, gridData: Grid): boolean {
	let [r0, c0] = a;
	const [r1, c1] = b;

	const dr = Math.abs(r1 - r0);
	const dc = Math.abs(c1 - c0);
	const sr = r0 < r1 ? 1 : -1;
	const sc = c0 < c1 ? 1 : -1;
	let err = dr - dc;

	while (true) {
		if (!isWalkable([r0, c0], gridData)) return false;
		if (r0 === r1 && c0 === c1) break;
		const e2 = 2 * err;

		if (e2 > -dc) {
			err -= dc;
			r0 += sr;
		}

		if (e2 < dr) {
			err += dr;
			c0 += sc;
		}
	}
	return true;
}

function smoothPath(gridPath: Vec2[], gridData: Grid): Vec2[] {
	if (gridPath.length <= 2) return gridPath;

	const smoothed: Vec2[] = [gridPath[0]!];
	let anchor = 0;

	for (let i = 2; i < gridPath.length; i++) {
		if (!hasLineOfSight(gridPath[anchor]!, gridPath[i]!, gridData)) {
			smoothed.push(gridPath[i - 1]!);
			anchor = i - 1;
		}
	}

	smoothed.push(gridPath[gridPath.length - 1]!);
	return smoothed;
}

export function findPath(
	start: Vec2,
	goal: Vec2,
	gridData: Grid,
): PathResult | null {
	const startGrid = worldToGrid(start, gridData);
	const goalGrid = worldToGrid(goal, gridData);

	if (!isWalkable(startGrid, gridData) || !isWalkable(goalGrid, gridData))
		return null;

	if (startGrid[0] === goalGrid[0] && startGrid[1] === goalGrid[1]) {
		return {
			waypoints: [start, goal],
			replanThresholdSq: M_GRID_SIZE * M_GRID_SIZE,
		};
	}

	const gridPath = astar(startGrid, goalGrid, gridData);
	if (!gridPath) return null;

	const smoothedGrid = smoothPath(gridPath, gridData);

	const waypoints: Vec2[] = smoothedGrid.map((p) => gridToWorld(p, gridData));
	waypoints[0] = start;
	waypoints[waypoints.length - 1] = goal;

	const replanThresholdSq = M_GRID_SIZE * M_GRID_SIZE;

	return { waypoints, replanThresholdSq };
}
