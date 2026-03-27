import { ServerPacketType } from "@mansion/shared/types/packets";
import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec3 } from "@mansion/shared/types/util";
import {
	type GameMap,
	type PositionedRoom,
	transform2dVec,
} from "@mansion/shared/utils/Map";
import Packet from "@mansion/shared/utils/Packet";
import Anomaly from "@/utils/Anomaly";
import type { WSClient, WSData } from "@/ws/types";

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
	private timeouts: NodeJS.Timeout[] = [];

	public static override description =
		"A ghostly entity that haunts the corridors of the mansion, instilling fear in those who cross its path.\nStay out of the red lights to avoid its wrath.";

	public override update(
		ws: Bun.ServerWebSocket<WSData>,
		_map: GameMap,
		players: WSClient[],
		_deltaTime: number,
	): void {
		if (!this.room) return;

		let presence = false;

		if (
			players
				.map((p) => p.playerData!.gameData!)
				.filter(
					(p) => this.room!.pointIn(transform2dVec(p.position)) && !p.crouched,
				).length > 0
		) {
			presence = true;
		}

		if (this.presence !== presence) {
			if (presence) {
				console.log(this.room.doorUUIDs);

				this.phase = PhantomPhases.Warning;

				this.timeouts.push(
					setTimeout(() => {
						this.room!.doorUUIDs.forEach((doorUuid) => {
							ws.publish(
								ws.data.lobby!,
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

	public override spawn(map: GameMap): [Vec3, Vec3] | null {
		const corridors = map.rooms.filter((r) => r.id === "corridor");
		const corridor = corridors[Math.floor(Math.random() * corridors.length)]!;

		this.position = [corridor.position[0], 0, corridor.position[1]];
		this.rotation = [0, 0, 0];
		this.room = corridor;

		corridor.anomalies.push((this.constructor as typeof Anomaly).id);

		return [this.position, this.rotation];
	}

	public override canCastSpell(playerData: PlayerGameData): boolean {
		if (!this.room) return false;
		return this.room.pointIn(transform2dVec(playerData.position));
	}

	public override get entityData() {
		return {
			roomId: this.room?.id ?? null,
			presence: this.presence,
			phase: this.phase,
		};
	}
}
