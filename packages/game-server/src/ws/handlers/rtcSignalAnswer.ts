import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import Packet from "@mansion/shared/utils/Packet";
import EventHandler from "@/EventHandler";
import clients from "@/services/client";

export default new EventHandler(
	ClientPacketType.RTCSignalAnswer,
	(_ws, { from, to, sdp }) => {
		clients
			.get(to)
			?.send(Packet.create(ServerPacketType.RTCSignalAnswer, { from, sdp }));
	},
);
