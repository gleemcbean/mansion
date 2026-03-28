import { M_GRID_SIZE } from "@mansion/shared/constants/map";
import type { Vec2 } from "@mansion/shared/types/util";

export type Grid = {
	bounds: { min: Vec2; max: Vec2; width: number; height: number };
	grid: boolean[][];
};

export function worldToGrid([x, y]: Vec2, gridData: Grid): Vec2 {
	return [
		Math.round((x - gridData.bounds.min[0]) / M_GRID_SIZE),
		Math.round((y - gridData.bounds.min[1]) / M_GRID_SIZE),
	];
}

export function gridToWorld([x, y]: Vec2, gridData: Grid): Vec2 {
	return [
		gridData.bounds.min[0] + (x + 0.5) * M_GRID_SIZE,
		gridData.bounds.min[1] + (y + 0.5) * M_GRID_SIZE,
	];
}

export default function isWalkable([x, y]: Vec2, gridData: Grid): boolean {
	if (x < 0 || x >= gridData.bounds.width / M_GRID_SIZE) return false;
	if (y < 0 || y >= gridData.bounds.height / M_GRID_SIZE) return false;
	return !!gridData.grid[y]?.[x];
}
