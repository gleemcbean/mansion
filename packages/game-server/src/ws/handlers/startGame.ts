import EventHandler from "@/EventHandler";
import { lobbies } from "@/services/lobby";
import { LobbyState } from "@mansion/shared/types/lobby";
import { ClientPacketType } from "@mansion/shared/types/packets";

export default new EventHandler(ClientPacketType.StartGame, (ws) => {
  if (!ws.data.lobby) return;
  const lobby = lobbies.get(ws.data.lobby);

  if (
    !lobby ||
    lobby.metadata.ownerUuid !== ws.data.uuid ||
    lobby.metadata.state !== LobbyState.Waiting
  )
    return;

  lobby.start();
});
