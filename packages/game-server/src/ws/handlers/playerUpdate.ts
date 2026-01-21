import { LobbyState } from "@mansion/shared/types/lobby";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import type { PlayerData } from "@mansion/shared/types/player";
import Packet from "@mansion/shared/utils/Packet";
import EventHandler from "@/EventHandler";
import { lobbies } from "@/services/lobby";

export default new EventHandler(
	ClientPacketType.PlayerUpdate,
	(ws, { gameData }) => {
		if (!ws.data.lobby) return;
		const lobby = lobbies.get(ws.data.lobby);
		if (!lobby || lobby.metadata.state !== LobbyState.InGame) return;

		const player = lobby.getPlayer(ws.data.uuid);
		if (!player) return;

		(player.playerData as PlayerData).gameData = gameData;

		ws.publish(
			ws.data.lobby,
			Packet.create(ServerPacketType.PlayerUpdate, {
				uuid: ws.data.uuid,
				client: player,
			}),
		);
	},
);
