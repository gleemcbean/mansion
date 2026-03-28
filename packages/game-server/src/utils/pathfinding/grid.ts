import { M_GRID_SIZE } from "@mansion/shared/constants/map";
import type { Vec2 } from "@mansion/shared/types/util";

export type Grid = {
	bounds: { min: Vec2; max: Vec2; width: number; height: number };
	grid: boolean[][];
};

export function worldToGrid([x, z]: Vec2, gridData: Grid): Vec2 {
	return [
		Math.round((z - gridData.bounds.min[1]) / M_GRID_SIZE),
		Math.round((x - gridData.bounds.min[0]) / M_GRID_SIZE),
	];
}

export function gridToWorld(p: Vec2, gridData: Grid): Vec2 {
	return [
		gridData.bounds.min[0] + (p[1] + 0.5) * M_GRID_SIZE,
		gridData.bounds.min[1] + (p[0] + 0.5) * M_GRID_SIZE,
	];
}

export default function isWalkable(p: Vec2, gridData: Grid): boolean {
	if (p[0] < 0 || p[0] >= gridData.bounds.height) return false;
	if (p[1] < 0 || p[1] >= gridData.bounds.width) return false;
	return gridData.grid[p[0]]![p[1]] === true;
}
