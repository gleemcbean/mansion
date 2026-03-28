import Packet from "@mansion/shared/objects/Packet";
import { ServerPacketType } from "@mansion/shared/types/packets";
import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec2, Vec3 } from "@mansion/shared/types/util";
import { wait, waitRandom } from "@mansion/shared/utils/time";
import { transform2dVec, transform3dVec } from "@mansion/shared/utils/vectors";
import Anomaly, { AnomalyState } from "@/objects/Anomaly";
import type { Grid } from "@/utils/pathfinding/grid";
import type { WSClient } from "@/ws/types";
import Pathfinding from "../Pathfinding";

export default class Doppelganger extends Anomaly {
	public static override id = "doppelganger";
	public static override name = "Doppelgänger";

	private focus: Vec2 | null = null;
	private pathfinding = new Pathfinding();

	public static override description =
		"A mysterious entity that mimics the appearance of fungies within the mansion.\nCast your spell before it gets too close.";

	public override canCastSpell(_playerData: PlayerGameData): boolean {
		return false;
	}

	private async updateRoam(deltaTime: number) {
		const pos = transform2dVec(this.position);
		if (!this.focus) this.focus = this.map.randomPoint();

		const gridData: Grid = {
			grid: this.map.toGrid(),
			bounds: this.map.bounds,
		};

		const { pos: newPos, rotationY } = this.pathfinding.tick(
			pos,
			this.focus!,
			gridData,
			0.003,
			deltaTime,
		);

		this.map.doors.forEach(({ position, uuid, isOpen }) => {
			if (
				isOpen ||
				Math.hypot(newPos[0] - position[0], newPos[1] - position[1]) > 1
			)
				return;

			this.ws.send(
				Packet.create(ServerPacketType.DoorToggle, {
					doorUuid: uuid,
					isOpen: true,
				}),
			);
		});

		this.position = transform3dVec(newPos, this.position[1]);
		this.rotation[1] = rotationY + Math.PI;

		if (
			Math.hypot(newPos[0] - this.focus![0], newPos[1] - this.focus![1]) > 1
		) {
			this.ws.send(
				Packet.create(ServerPacketType.AnomalyUpdate, {
					anomalyId: this.id,
					data: this.toJSON(),
				}),
			);

			return;
		} else {
			this.paused = true;
			await waitRandom(500, 4000);
			this.focus = this.map.randomPoint();
			this.paused = false;
		}
	}

	public override update(_players: WSClient[], deltaTime: number) {
		if (this.paused) return;

		switch (this.state) {
			case AnomalyState.Roam:
				this.updateRoam(deltaTime);
				break;
		}
	}

	public override spawn(): [Vec3, Vec3] | null {
		const spawn = this.map.randomSpawn();
		if (!spawn) return null;

		this.position = [spawn[0], 0.865, spawn[1]];

		return [this.position, this.rotation];
	}
}
