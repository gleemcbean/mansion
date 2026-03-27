import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec3 } from "@mansion/shared/types/util";
import type { GameMap } from "@mansion/shared/utils/Map";
import Anomaly from "@/utils/Anomaly";
import type { WSClient, WSData } from "@/ws/types";

export default class Doppelganger extends Anomaly {
	public static override id = "doppelganger";
	public static override name = "Doppelgänger";

	public static override description =
		"A mysterious entity that mimics the appearance of fungies within the mansion.\nCast your spell before it gets too close.";

	public override canCastSpell(_playerData: PlayerGameData): boolean {
		return false;
	}

	public override update(
		_ws: Bun.ServerWebSocket<WSData>,
		_map: GameMap,
		_players: WSClient[],
		_deltaTime: number,
	) {}

	public override spawn(map: GameMap): [Vec3, Vec3] | null {
		const spawn = map.randomSpawn();
		if (!spawn) return null;

		this.position = [spawn[0], 0.865, spawn[1]];

		return [this.position, this.rotation];
	}
}
