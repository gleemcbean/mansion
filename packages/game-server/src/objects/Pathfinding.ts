import { M_GRID_SIZE } from "@mansion/shared/constants/map";
import type { Vec2 } from "@mansion/shared/types/util";
import { findPath, type PathResult } from "@/utils/pathfinding/findPath";
import type { Grid } from "@/utils/pathfinding/grid";

export default class Pathfinding {
	private path: PathResult | null = null;
	private waypointIdx = 1;
	private lastGoal: Vec2 = [0, 0];

	tick(
		botPos: Vec2,
		goalPos: Vec2,
		gridData: Grid,
		speed: number,
		dt: number,
	): Vec2 {
		const [lx, lz] = this.lastGoal;
		const [hx, hz] = goalPos;
		const dx = hx - lx;
		const dz = hz - lz;
		const shouldReplan =
			!this.path || dx * dx + dz * dz > this.path.replanThresholdSq;

		if (shouldReplan) {
			this.path = findPath(botPos, goalPos, gridData);
			this.waypointIdx = 1;
			this.lastGoal = goalPos;
		}

		if (!this.path || this.waypointIdx >= this.path.waypoints.length)
			return botPos;

		const [tx, tz] = this.path.waypoints[this.waypointIdx]!;
		const [bx, bz] = botPos;
		const dx2 = tx - bx;
		const dz2 = tz - bz;
		const distSq = dx2 * dx2 + dz2 * dz2;

		const arrivalRadius = M_GRID_SIZE * 0.5;
		if (distSq < arrivalRadius * arrivalRadius) {
			this.waypointIdx++;
			return botPos;
		}

		const dist = Math.sqrt(distSq);
		const move = Math.min(speed * dt, dist);
		return [bx + (dx2 / dist) * move, bz + (dz2 / dist) * move];
	}
}
