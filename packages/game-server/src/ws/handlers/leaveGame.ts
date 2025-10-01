import EventHandler from "@/EventHandler";
import { lobbies } from "@/services/lobby";
import { ClientPacketType } from "@mansion/shared/types/packets";

export default new EventHandler(ClientPacketType.LeaveGame, (ws) => {
  if (!ws.data.lobby) return;
  const lobby = lobbies.get(ws.data.lobby);
  if (!lobby) return;
  lobby.removePlayer(ws.data.uuid);
});
