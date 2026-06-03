import {
	LB_MAX_PLAYERS,
	LB_MIN_PLAYERS,
} from "@mansion/shared/constants/lobby";
import type GameMap from "@mansion/shared/objects/map/GameMap";
import Packet from "@mansion/shared/objects/Packet";
import { type LobbyMetadata, LobbyState } from "@mansion/shared/types/lobby";
import { ServerPacketType } from "@mansion/shared/types/packets";
import {
	type Client,
	PlayerMushroomCapColor,
} from "@mansion/shared/types/player";
import type { UUID } from "@mansion/shared/types/util";
import type Anomaly from "@/objects/Anomaly";
import Generators from "@/objects/Generators";
import { ANOMALIES } from "@/utils/anomalies";
import type { WSClient, WSData } from "@/ws/types";

export default class Lobby {
	public map: GameMap | null = null;
	public metadata: LobbyMetadata;
	private players: Map<UUID, WSClient> = new Map();
	public anomalies: Anomaly[] = [];
	public updateLoop: NodeJS.Timeout | null = null;

	public constructor(owner: WSClient) {
		this.metadata = {
			code: Generators.generateLobbyCode(),
			state: LobbyState.Waiting,
			ownerUUID: owner.uuid,
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

		if (uuid === this.metadata.ownerUUID && this.players.size > 0) {
			const newOwner = this.players.values().next().value!;
			this.metadata.ownerUUID = newOwner.uuid;

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
		this.metadata.ownerUUID = uuid;

		this.players.forEach((p) => {
			p.ws.send(
				Packet.create(ServerPacketType.LobbyMetadataUpdate, {
					metadata: this.metadata,
				}),
			);
		});
	}

	public start(ws: Bun.ServerWebSocket<WSData>) {
		if (
			this.players.size < LB_MIN_PLAYERS ||
			this.metadata.state !== LobbyState.Waiting
		)
			return;

		this.metadata.state = LobbyState.InGame;
		this.map = Generators.generateMap();

		const playersArray = Array.from(this.players.values());
		const spawns = playersArray.map(() => this.map!.randomSpawn());

		ANOMALIES.forEach((Anomaly) => {
			const anomaly = new Anomaly(ws, this.map!);
			const anomalySpawn = anomaly.spawn();
			if (anomalySpawn) this.anomalies.push(anomaly);
		});

		this.anomalies.forEach((a) => {
			setTimeout(
				() => {
					a.paused = false;
				},
				Math.random() * 2000 + 1000,
			);
		});

		if (this.updateLoop) clearTimeout(this.updateLoop);

		let lastUpdate = Date.now();

		this.updateLoop = setInterval(() => {
			this.anomalies.forEach((anomaly) => {
				anomaly.update(
					this.players.values().toArray(),
					Date.now() - lastUpdate,
				);

				lastUpdate = Date.now();
			});
		}, 1000 / 20);

		playersArray.forEach((p, i) => {
			const [sx, sy] = spawns[i] ?? [0, 0];
			if (!p.playerData) return;

			p.playerData.gameData = {
				position: [sx, 1, sy],
				quaternion: [0, 0, 0, 1],
				crouched: false,
				running: false,
				energy: 100,
				health: 100,
				lighting: false,
				anomalySteps: Object.fromEntries(this.anomalies.map((a) => [a.id, 0])),
				captured: [],
			};

			p.ws.send(
				Packet.create(ServerPacketType.GameStarted, {
					metadata: this.metadata,
					map: this.map,
					gameData: p.playerData.gameData,
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

		this.anomalies.forEach((a) => {
			a.kill();
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
