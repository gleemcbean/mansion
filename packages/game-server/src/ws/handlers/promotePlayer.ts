import EventHandler from "@/EventHandler";
import { lobbies } from "@/services/lobby";
import { ClientPacketType } from "@mansion/shared/types/packets";

export default new EventHandler(
  ClientPacketType.PromotePlayer,
  (ws, { uuid }) => {
    if (!ws.data.lobby) return;
    const lobby = lobbies.get(ws.data.lobby);
    if (!lobby || lobby.metadata.ownerUuid !== ws.data.uuid) return;
    lobby.promotePlayer(uuid);
  }
);
