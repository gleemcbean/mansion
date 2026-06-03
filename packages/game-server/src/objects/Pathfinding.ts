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
	): { pos: Vec2; rotationY: number } {
		const [lx, lz] = this.lastGoal;
		const [hx, hz] = goalPos;
		const dx = hx - lx;
		const dy = hz - lz;
		const shouldReplan =
			!this.path || dx * dx + dy * dy > this.path.replanThresholdSq;

		if (shouldReplan) {
			this.path = findPath(botPos, goalPos, gridData);
			this.waypointIdx = 1;
			this.lastGoal = goalPos;
		}

		if (!this.path || this.waypointIdx >= this.path.waypoints.length)
			return { pos: botPos, rotationY: 0 };

		const [tx, tz] = this.path.waypoints[this.waypointIdx]!;
		const [bx, bz] = botPos;
		const dx2 = tx - bx;
		const dy2 = tz - bz;
		const distSq = dx2 * dx2 + dy2 * dy2;

		const arrivalRadius = M_GRID_SIZE * 0.5;
		if (distSq < arrivalRadius * arrivalRadius) {
			this.waypointIdx++;
			return { pos: botPos, rotationY: 0 };
		}

		const dist = Math.sqrt(distSq);
		const move = Math.min(speed * dt, dist);
		const pos = [bx + (dx2 / dist) * move, bz + (dy2 / dist) * move] as Vec2;
		const rotationY = Math.atan2(dx2, dy2);
		return { pos, rotationY };
	}
}
