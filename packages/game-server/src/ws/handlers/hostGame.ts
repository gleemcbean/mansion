import EventHandler from "@/EventHandler";
import { Lobby } from "@/services/lobby";
import {
  ClientPacketType,
  ServerPacketType,
} from "@mansion/shared/types/packets";
import Packet from "@mansion/shared/utils/Packet";

export default new EventHandler(ClientPacketType.HostGame, (ws) => {
  const lobby = new Lobby({
    uuid: ws.data.uuid,
    username: ws.data.username!,
    ws,
  });

  const me = lobby.getPlayer(ws.data.uuid)!;

  ws.send(
    Packet.create(ServerPacketType.GameHosted, {
      ...lobby.toJSON(),
      playerData: me.playerData,
    })
  );
});
