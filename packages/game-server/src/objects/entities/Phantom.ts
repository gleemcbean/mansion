import type PositionedRoom from "@mansion/shared/objects/map/PositionedRoom";
import Packet from "@mansion/shared/objects/Packet";
import { ServerPacketType } from "@mansion/shared/types/packets";
import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec3 } from "@mansion/shared/types/util";
import { transform2dVec } from "@mansion/shared/utils/vectors";
import Anomaly from "@/objects/Anomaly";
import type { WSClient } from "@/ws/types";

enum PhantomPhases {
	Idle,
	Warning,
	Damaging,
}

export default class Phantom extends Anomaly {
	public static override id = "phantom";
	public static override name = "Phantom";

	private room: PositionedRoom | null = null;
	private presence = false;
	private phase: PhantomPhases = PhantomPhases.Idle;

	public static override description =
		"A ghostly entity that haunts the corridors of the mansion, instilling fear in those who cross its path.\nStay out of the red lights to avoid its wrath.";

	public override update(players: WSClient[], _deltaTime: number): void {
		if (this.paused || !this.room) return;

		let presence = false;

		if (
			players
				.map((p) => p.playerData!.gameData!)
				.filter(
					(p) =>
						this.room!.t_pointIn(transform2dVec(p.position)) && !p.crouched,
				).length > 0
		) {
			presence = true;
		}

		if (this.presence !== presence) {
			if (presence) {
				this.phase = PhantomPhases.Warning;

				this.timeouts.push(
					setTimeout(() => {
						this.room!.doorUUIDs.forEach((doorUuid) => {
							this.ws.send(
								Packet.create(ServerPacketType.DoorToggle, {
									doorUuid,
									isOpen: false,
								}),
							);
						});
					}, 500),
				);

				this.timeouts.push(
					setTimeout(() => {
						this.room!.lights.forEach((light) => {
							light.color = 0xc7001b;
							light.intensity = 2;
						});

						this.phase = PhantomPhases.Damaging;
					}, 3000),
				);
			} else {
				this.phase = PhantomPhases.Idle;

				this.timeouts.forEach((timeout) => {
					clearTimeout(timeout);
				});

				this.timeouts = [];

				this.room.lights.forEach((light) => {
					delete light.color;
					delete light.intensity;
				});
			}
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
			roomId: this.room?.id ?? null,
			presence: this.presence,
			phase: this.phase,
		};
	}
}
