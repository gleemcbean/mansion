import { ANOMALIES } from "@mansion/shared/constants/anomalies";
import {
	LB_MAX_PLAYERS,
	LB_MIN_PLAYERS,
} from "@mansion/shared/constants/lobby";
import { type LobbyMetadata, LobbyState } from "@mansion/shared/types/lobby";
import { ServerPacketType } from "@mansion/shared/types/packets";
import {
	type Client,
	PlayerMushroomCapColor,
} from "@mansion/shared/types/player";
import type { UUID } from "@mansion/shared/types/util";
import type Anomaly from "@mansion/shared/utils/Anomaly";
import Packet from "@mansion/shared/utils/Packet";
import Generators from "@/utils/Generators";
import type { WSClient } from "@/ws/types";

export class Lobby {
	public metadata: LobbyMetadata;
	private players: Map<UUID, WSClient> = new Map();
	private anomalies: Anomaly[] = [];
	public updateLoop: NodeJS.Timeout | null = null;

	public constructor(owner: WSClient) {
		this.metadata = {
			code: Generators.generateLobbyCode(),
			state: LobbyState.Waiting,
			ownerUuid: owner.uuid,
			map: null,
		};

		this.addPlayer(owner);
		lobbies.set(this.metadata.code, this);
	}

	private getAvailableCapColor() {
		const playerCaps = Array.from(this.players.values()).map(
			(p) => p.playerData?.mushroomCapColor,
		);

		const availableColors = Object.values(PlayerMushroomCapColor).filter((c) =>
			playerCaps.every((p) => p !== c),
		);

		return (
			availableColors[Math.floor(Math.random() * availableColors.length)] ??
			PlayerMushroomCapColor.Red
		);
	}

	public getPlayer(uuid: UUID) {
		return this.players.get(uuid);
	}

	public addPlayer(player: WSClient) {
		player.playerData = {
			mushroomCapColor: this.getAvailableCapColor(),
		};

		if (this.players.size >= LB_MAX_PLAYERS) {
			player.ws.send(
				Packet.create(ServerPacketType.Error, { reason: "Lobby is full" }),
			);

			return;
		}

		this.players.set(player.uuid, player);

		player.ws.data.lobby = this.metadata.code;
		player.ws.subscribe(this.metadata.code);

		player.ws.send(
			Packet.create(ServerPacketType.GameJoined, {
				...this.toJSON(),
				playerData: player.playerData,
			}),
		);

		player.ws.publish(
			this.metadata.code,
			Packet.create(ServerPacketType.PlayerJoined, { player }),
		);

		return player;
	}

	public removePlayer(uuid: UUID) {
		const player = this.players.get(uuid);
		if (!player) return;
		this.players.delete(uuid);

		player.ws.data.lobby = undefined;
		player.ws.unsubscribe(this.metadata.code);

		this.players.forEach((p) => {
			p.ws.send(Packet.create(ServerPacketType.PlayerLeft, { uuid }));
		});

		if (uuid === this.metadata.ownerUuid && this.players.size > 0) {
			const newOwner = this.players.values().next().value!;
			this.metadata.ownerUuid = newOwner.uuid;

			this.players.forEach((p) => {
				p.ws.send(
					Packet.create(ServerPacketType.LobbyMetadataUpdate, {
						metadata: this.metadata,
					}),
				);
			});
		}

		if (this.players.size === 0) this.close();
	}

	public kickPlayer(uuid: UUID) {
		const player = this.players.get(uuid);
		if (!player) return;
		player.ws.send(Packet.create(ServerPacketType.Kicked));
		this.removePlayer(uuid);
	}

	public promotePlayer(uuid: UUID) {
		if (!this.players.has(uuid)) return;
		this.metadata.ownerUuid = uuid;

		this.players.forEach((p) => {
			p.ws.send(
				Packet.create(ServerPacketType.LobbyMetadataUpdate, {
					metadata: this.metadata,
				}),
			);
		});
	}

	public start() {
		if (
			this.players.size < LB_MIN_PLAYERS ||
			this.metadata.state !== LobbyState.Waiting
		)
			return;

		this.metadata.state = LobbyState.InGame;
		this.metadata.map = Generators.generateMap();

		const playersArray = Array.from(this.players.values());
		const spawns = playersArray.map(() => this.metadata.map!.randomSpawn());

		ANOMALIES.forEach((Anomaly) => {
			const anomaly = new Anomaly();
			const anomalySpawn = anomaly.spawn(this.metadata.map!);
			if (anomalySpawn) this.anomalies.push(anomaly as Anomaly);
		});

		if (this.updateLoop) clearTimeout(this.updateLoop);

		let lastUpdate = Date.now();

		this.updateLoop = setInterval(() => {
			this.anomalies.forEach((anomaly) => {
				anomaly.update(
					this.metadata.map!,
					this.players
						.values()
						.toArray()
						.map((wsClient) => wsClient.playerData!.gameData!),
					Date.now() - lastUpdate,
				);
				lastUpdate = Date.now();
			});
		}, 1000 / 20);

		playersArray.forEach((p, i) => {
			const [sx, sy] = spawns[i] ?? [0, 0];

			p.playerData!.gameData = {
				position: [sx, 1, sy],
				quaternion: [0, 0, 0, 1],
				crouched: false,
				running: false,
				energy: 100,
				health: 100,
				lighting: false,
			};

			p.ws.send(
				Packet.create(ServerPacketType.GameStarted, {
					metadata: this.metadata,
					gameData: p.playerData!.gameData,
					anomalies: this.anomalies.map((a) => a.toJSON()),
				}),
			);
		});
	}

	public close() {
		this.players.forEach((p) => {
			p.ws.data.lobby = undefined;
			p.ws.unsubscribe(this.metadata.code);
			p.ws.send(Packet.create(ServerPacketType.GameClosed));
		});

		if (this.updateLoop) {
			clearTimeout(this.updateLoop);
			this.updateLoop = null;
		}

		lobbies.delete(this.metadata.code);
	}

	public toJSON() {
		return {
			metadata: this.metadata,
			players: Array.from(this.players.values()).map((p) => {
				const { ws, ...playerWithoutWs } = p;
				return playerWithoutWs as Client;
			}),
		};
	}
}

export const lobbies = new Map<string, Lobby>();
