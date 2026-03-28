import Packet from "@mansion/shared/objects/Packet";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import EventHandler from "@/EventHandler";

export default new EventHandler(ClientPacketType.Ready, (ws) => {
	const packet = Packet.create(ServerPacketType.Initialize, {
		uuid: ws.data.uuid,
		username: ws.data.username,
	});

	ws.send(packet);
});
