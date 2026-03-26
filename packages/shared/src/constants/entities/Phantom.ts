import type { PlayerGameData } from "@/types/player";
import type { Vec3 } from "@/types/util";
import Anomaly from "@/utils/Anomaly";
import { type GameMap, type PositionedRoom, transform2dVec } from "@/utils/Map";

export default class Phantom extends Anomaly {
	public static override id = "phantom";
	public static override name = "Phantom";

	private room: PositionedRoom | null = null;
	private damageMode = false;

	public static override description =
		"A ghostly entity that haunts the corridors of the mansion, instilling fear in those who cross its path.\nStay out of the red lights to avoid its wrath.";

	public override update(
		_map: GameMap,
		players: PlayerGameData[],
		_deltaTime: number,
	): void {
		if (!this.room) return;

		let damageMode = false;

		if (
			players
				.filter((p) => this.room!.pointIn(transform2dVec(p.position)))
				.some((p) => !p.crouched)
		) {
			damageMode = true;
		}

		if (damageMode && !this.damageMode) {
			this.room.lights.forEach((light) => {
				light.color = 0xc7001b;
				light.intensity = 2;
			});
		}

		if (!damageMode && this.damageMode) {
			this.room.lights.forEach((light) => {
				delete light.color;
				delete light.intensity;
			});
		}

		this.damageMode = damageMode;
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
