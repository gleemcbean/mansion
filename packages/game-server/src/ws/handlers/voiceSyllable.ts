import Packet from "@mansion/shared/objects/Packet";
import { LobbyState } from "@mansion/shared/types/lobby";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import EventHandler from "@/EventHandler";
import { lobbies } from "@/objects/Lobby";
import clients from "@/services/client";

export default new EventHandler(
	ClientPacketType.VoiceSyllable,
	(_ws, { uuid, syllable }) => {
		console.log(`Received syllable from ${uuid}: ${syllable}`);
		const client = clients.get(uuid);
		if (!client || !client.data.lobby) return;
		const lobby = lobbies.get(client.data.lobby);
		if (!lobby || lobby.metadata.state !== LobbyState.InGame) return;
		const player = lobby.getPlayer(uuid);
		if (!player?.playerData?.gameData) return;
		const playerData = player.playerData!.gameData!;

		lobby.anomalies.forEach((anomaly) => {
			if (!anomaly.canCastSpell(playerData)) return;
			const expectedSyllable =
				anomaly.syllables[playerData.anomalySteps[anomaly.id]!];

			if (
				syllable === expectedSyllable &&
				++playerData.anomalySteps[anomaly.id]! >= anomaly.syllables.length
			) {
				playerData.captured.push(anomaly.id);
			}

			client.send(
				Packet.create(ServerPacketType.PlayerUpdate, { uuid, client: player }),
			);
		});
	},
);
