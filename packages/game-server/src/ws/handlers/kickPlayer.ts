import { ClientPacketType } from "@mansion/shared/types/packets";
import EventHandler from "@/EventHandler";
import { lobbies } from "@/services/lobby";

export default new EventHandler(ClientPacketType.KickPlayer, (ws, { uuid }) => {
	if (!ws.data.lobby) return;
	const lobby = lobbies.get(ws.data.lobby);
	if (!lobby || lobby.metadata.ownerUuid !== ws.data.uuid) return;
	lobby.kickPlayer(uuid);
});
