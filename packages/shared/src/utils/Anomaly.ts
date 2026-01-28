import type { Vec3 } from "@/types/util";
import type { GameMap } from "./Map";

export default abstract class Anomaly {
	public position: Vec3 = [0, 0, 0];
	public rotation: Vec3 = [0, 0, 0];

	public constructor(
		public id: string,
		public name: string,
	) {}

	public abstract update(map: GameMap, deltaTime: number): void;

	public abstract spawn(map: GameMap): [Vec3, Vec3] | null;

	public toJSON() {
		return {
			id: this.id,
			name: this.name,
			position: this.position,
			rotation: this.rotation,
		};
	}
}
