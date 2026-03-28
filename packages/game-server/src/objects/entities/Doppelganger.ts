import type GameMap from "@mansion/shared/objects/map/GameMap";
import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec2, Vec3 } from "@mansion/shared/types/util";
import { transform2dVec } from "@mansion/shared/utils/vectors";
import Anomaly, { AnomalyState } from "@/objects/Anomaly";
import type { WSClient } from "@/ws/types";

export default class Doppelganger extends Anomaly {
	public static override id = "doppelganger";
	public static override name = "Doppelgänger";
	public focus: Vec2 | null = null;

	public static override description =
		"A mysterious entity that mimics the appearance of fungies within the mansion.\nCast your spell before it gets too close.";

	public override canCastSpell(_playerData: PlayerGameData): boolean {
		return false;
	}

	private updateRoam() {
		if (!this.focus) return;

		transform2dVec(this.position);
	}

	public override update(_players: WSClient[], _deltaTime: number) {
		switch (this.state) {
			case AnomalyState.Roam:
				this.updateRoam();
				break;
		}
	}

	public override spawn(map: GameMap): [Vec3, Vec3] | null {
		const spawn = map.randomSpawn();
		if (!spawn) return null;

		this.position = [spawn[0], 0.865, spawn[1]];

		return [this.position, this.rotation];
	}
}
