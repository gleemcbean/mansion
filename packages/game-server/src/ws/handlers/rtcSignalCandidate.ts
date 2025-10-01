import EventHandler from "@/EventHandler";
import {
  ClientPacketType,
  ServerPacketType,
} from "@mansion/shared/types/packets";
import clients from "@/services/client";
import Packet from "@mansion/shared/utils/Packet";

export default new EventHandler(
  ClientPacketType.RTCSignalCandidate,
  (_ws, { from, to, candidate }) => {
    clients
      .get(to)
      ?.send(
        Packet.create(ServerPacketType.RTCSignalCandidate, { from, candidate })
      );
  }
);
