import { CardinalDirection, type Vec3 } from "@/types/util";
import Anomaly from "@/utils/Anomaly";
import type { GameMap } from "@/utils/Map";

export default class Tentacles extends Anomaly {
	public constructor() {
		super("tentacles", "Tentacles");
	}

	public override update(map: GameMap, deltaTime: number): void {}

	public override spawn(map: GameMap): [Vec3, Vec3] | null {
		const bedrooms = map.rooms.filter(
			(r) => r.id.startsWith("bedroom") && !r.anomalies.includes(this.id),
		);

		if (bedrooms.length < 1) return null;

		const room = bedrooms[Math.floor(Math.random() * bedrooms.length)]!;
		let x: number, z: number, direction: CardinalDirection;

		if (room.id === "bedroom1") {
			[x, z, direction] = room.translate([4.5, 0.75], CardinalDirection.North);
		} else if (room.id === "bedroom2") {
			[x, z, direction] = room.translate([1, 3.5], CardinalDirection.West);
		} else {
			throw new Error("Impossible type");
		}

		this.rotation = [0, direction * (Math.PI / 2), 0];
		this.position = [x, 0.1, z];
		room.anomalies.push(this.id);

		return [this.position, this.rotation];
	}
}
