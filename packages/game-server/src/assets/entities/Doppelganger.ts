import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec3 } from "@mansion/shared/types/util";
import Anomaly from "@mansion/shared/utils/Anomaly";
import type { GameMap } from "@mansion/shared/utils/Map";
import { findPath } from "@/utils/Pathfinding";

export default class Doppelganger extends Anomaly {
	public static override id = "doppelganger";
	public static override name = "Doppelgänger";

	public static override description =
		"A mysterious entity that mimics the appearance of fungies within the mansion.\nCast your spell before it gets too close.";

	public override update(
		map: GameMap,
		players: PlayerGameData[],
		deltaTime: number,
	) {}

	public override spawn(map: GameMap): [Vec3, Vec3] | null {
		const spawn = map.randomSpawn();
		if (!spawn) return null;

		this.position = [spawn[0], 0.865, spawn[1]];

		return [this.position, this.rotation];
	}
}
