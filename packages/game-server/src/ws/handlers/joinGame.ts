import EventHandler from "@/EventHandler";
import { lobbies } from "@/services/lobby";
import {
  ClientPacketType,
  ServerPacketType,
} from "@mansion/shared/types/packets";
import Packet from "@mansion/shared/utils/Packet";

export default new EventHandler(ClientPacketType.JoinGame, (ws, { code }) => {
  if (ws.data.lobby || !code) return;

  const lobby = lobbies.get(code);

  if (!lobby) {
    return ws.send(Packet.create(ServerPacketType.InvalidCode));
  }

  lobby.addPlayer({
    uuid: ws.data.uuid,
    username: ws.data.username,
    ws,
  });
});
