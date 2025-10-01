import EventHandler from "@/EventHandler";
import {
  ClientPacketType,
  ServerPacketType,
} from "@mansion/shared/types/packets";
import clients from "@/services/client";
import Packet from "@mansion/shared/utils/Packet";

export default new EventHandler(
  ClientPacketType.RTCSignalAnswer,
  (_ws, { from, to, sdp }) => {
    clients
      .get(to)
      ?.send(Packet.create(ServerPacketType.RTCSignalAnswer, { from, sdp }));
  }
);
