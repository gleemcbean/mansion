import { LobbyState } from "@mansion/shared/types/lobby";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import type { GameMap } from "@mansion/shared/utils/Map";
import Packet from "@mansion/shared/utils/Packet";
import EventHandler from "@/EventHandler";
import { lobbies } from "@/services/lobby";

export default new EventHandler(
	ClientPacketType.DoorToggle,
	(ws, { doorId, isOpen }) => {
		if (!ws.data.lobby) return;
		const lobby = lobbies.get(ws.data.lobby);
		if (!lobby || lobby.metadata.state !== LobbyState.InGame) return;

		const map: GameMap = lobby.metadata.map;
		const door = map.getDoor(doorId);
		if (!door) return;

		door.opened = isOpen;

		ws.publish(
			ws.data.lobby,
			Packet.create(ServerPacketType.DoorToggle, { doorId, isOpen }),
		);
	},
);
