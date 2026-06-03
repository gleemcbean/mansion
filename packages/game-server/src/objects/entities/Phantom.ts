import type PositionedRoom from "@mansion/shared/objects/map/PositionedRoom";
import Packet from "@mansion/shared/objects/Packet";
import { AnomalyState } from "@mansion/shared/types/anomalies";
import { ServerPacketType } from "@mansion/shared/types/packets";
import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec3 } from "@mansion/shared/types/util";
import { transform2dVec } from "@mansion/shared/utils/vectors";
import Anomaly from "@/objects/Anomaly";
import type { WSClient } from "@/ws/types";

export default class Phantom extends Anomaly {
	public static override id = "phantom";
	public static override name = "Phantom";

	private room: PositionedRoom | null = null;
	private presence: boolean = false;

	public static override description =
		"A ghostly entity that haunts the corridors of the mansion, instilling fear in those who cross its path.\nStay out of the red lights to avoid its wrath.";

	private updateState(state: AnomalyState) {
		this.state = state;

		this.ws.send(
			Packet.create(ServerPacketType.AnomalyUpdate, {
				anomalyId: this.id,
				data: this.toJSON(),
			}),
		);
	}

	public override update(players: WSClient[], _deltaTime: number): void {
		if (this.paused || !this.room) return;

		let presence = false;

		if (
			players
				.map((p) => p.playerData!.gameData!)
				.filter(
					(p) =>
						this.room!.t_pointIn(transform2dVec(p.position)) &&
						(this.state === AnomalyState.Roam ? !p.crouched : true),
				).length > 0
		) {
			presence = true;
		}

		if (this.presence !== presence) {
			if (presence) {
				this.updateState(AnomalyState.Move);

				this.timeouts.push(
					setTimeout(() => {
						this.ws.send(
							Packet.create(ServerPacketType.DoorsToggle, {
								doorUUIDs: this.room!.doorUUIDs,
								isOpen: false,
							}),
						);
					}, 500),
				);

				this.timeouts.push(
					setTimeout(() => this.updateState(AnomalyState.Chase), 3000),
				);
			} else {
				this.updateState(AnomalyState.Roam);
				this.kill();
			}
		}

		if (this.presence && this.state === AnomalyState.Chase) {
			players.forEach((p) => {
				const data = p?.playerData?.gameData;
				if (!data) return;
				data.health -= 1;

				p.ws.send(
					Packet.create(ServerPacketType.PlayerUpdate, {
						uuid: p.uuid,
						client: { playerData: { gameData: { health: data.health } } },
					}),
				);
			});
		}

		this.presence = presence;
	}

	public override spawn(): [Vec3, Vec3] | null {
		const corridors = this.map.rooms.filter((r) => r.id === "corridor");
		const corridor = corridors[Math.floor(Math.random() * corridors.length)]!;

		this.position = [corridor.position[0], 0, corridor.position[1]];
		this.rotation = [0, 0, 0];
		this.room = corridor;

		corridor.anomalies.push((this.constructor as typeof Anomaly).id);

		return [this.position, this.rotation];
	}

	public override canCastSpell(playerData: PlayerGameData): boolean {
		if (!this.room) return false;
		return this.room.t_pointIn(transform2dVec(playerData.position));
	}

	public override get entityData() {
		return {
			roomUUID: this.room?.uuid ?? null,
			presence: this.presence,
		};
	}
}
