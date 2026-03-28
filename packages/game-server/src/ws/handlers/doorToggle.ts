import type GameMap from "@mansion/shared/objects/map/GameMap";
import Packet from "@mansion/shared/objects/Packet";
import { LobbyState } from "@mansion/shared/types/lobby";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import EventHandler from "@/EventHandler";
import { lobbies } from "@/objects/Lobby";

export default new EventHandler(
	ClientPacketType.DoorToggle,
	(ws, { doorUuid, isOpen }) => {
		if (!ws.data.lobby) return;
		const lobby = lobbies.get(ws.data.lobby);
		if (!lobby || lobby.metadata.state !== LobbyState.InGame) return;

		const map: GameMap = lobby.metadata.map;
		const door = map.getDoor(doorUuid);
		if (!door) return;

		door.opened = isOpen;

		ws.publish(
			ws.data.lobby,
			Packet.create(ServerPacketType.DoorToggle, { doorUuid, isOpen }),
		);
	},
);
