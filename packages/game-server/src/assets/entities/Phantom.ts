import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec3 } from "@mansion/shared/types/util";
import Anomaly from "@mansion/shared/utils/Anomaly";
import { type GameMap, type PositionedRoom, transform2dVec } from "@mansion/shared/utils/Map";

export default class Phantom extends Anomaly {
	public static override id = "phantom";
	public static override name = "Phantom";

	private room: PositionedRoom | null = null;

	public static override description =
		"A ghostly entity that haunts the corridors of the mansion, instilling fear in those who cross its path.\nStay out of the red lights to avoid its wrath.";

	public override update(
		_map: GameMap,
		players: PlayerGameData[],
		_deltaTime: number,
	): void {
		if (!this.room) return;

		if (
			players
				.filter((p) => this.room!.pointIn(transform2dVec(p.position)))
				.some((p) => !p.crouched)
		) {
			// this.room.lights.
		}
	}

	public override spawn(map: GameMap): [Vec3, Vec3] | null {
		const corridors = map.rooms.filter((r) => r.id === "corridor");
		const corridor = corridors[Math.floor(Math.random() * corridors.length)]!;

		this.position = [corridor.position[0], 0, corridor.position[1]];
		this.rotation = [0, 0, 0];
		this.room = corridor;

		corridor.anomalies.push((this.constructor as typeof Anomaly).id);

		return [this.position, this.rotation];
	}
}
