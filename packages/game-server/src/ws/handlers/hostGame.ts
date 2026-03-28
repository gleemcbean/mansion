import Packet from "@mansion/shared/objects/Packet";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import EventHandler from "@/EventHandler";
import Lobby from "@/objects/Lobby";
import type { WSClient } from "../types";

export default new EventHandler(ClientPacketType.HostGame, (ws) => {
	const lobby = new Lobby({
		uuid: ws.data.uuid,
		username: ws.data.username as string,
		ws,
	});

	const me = lobby.getPlayer(ws.data.uuid) as WSClient;

	ws.send(
		Packet.create(ServerPacketType.GameHosted, {
			...lobby.toJSON(),
			playerData: me.playerData,
		}),
	);
});
