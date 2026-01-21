import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import Packet from "@mansion/shared/utils/Packet";
import EventHandler from "@/EventHandler";
import clients from "@/services/client";

export default new EventHandler(
	ClientPacketType.RTCSignalCandidate,
	(_ws, { from, to, candidate }) => {
		clients
			.get(to)
			?.send(
				Packet.create(ServerPacketType.RTCSignalCandidate, { from, candidate }),
			);
	},
);
