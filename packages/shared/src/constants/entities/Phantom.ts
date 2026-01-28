import type { Vec3 } from "@/types/util";
import Anomaly from "@/utils/Anomaly";
import type { GameMap } from "@/utils/Map";

export default class Phantom extends Anomaly {
	public constructor() {
		super("phantom", "Phantom");
	}

	public override update(map: GameMap, deltaTime: number): void {}

	public override spawn(map: GameMap): [Vec3, Vec3] | null {
		const corridors = map.rooms.filter((r) => r.id === "corridor");
		const corridor = corridors[Math.floor(Math.random() * corridors.length)]!;

		this.position = [corridor.position[0], 0, corridor.position[1]];
		this.rotation = [0, 0, 0];

		corridor.anomalies.push(this.id);

		return [this.position, this.rotation];
	}
}
