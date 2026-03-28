import type { Anomaly } from "@mansion/shared/types/anomalies";
import type { Client } from "@mansion/shared/types/player";
import { useMemo } from "react";
import useLobby from "@/hooks/useLobby";
import Player from "../Player";

type DoppelgangerProps = {
	data: Anomaly;
};

export default function Doppelganger({ data }: DoppelgangerProps) {
	const { players } = useLobby();

	const targetPlayer = useMemo(() => {
		const playersArray = Array.from(players.values());
		const client = playersArray[
			Math.floor(Math.random() * players.size)
		] as Required<Client>;

		client.playerData.gameData = {
			position: data.position,
			quaternion: [0, 0, 0, 0],
			energy: 100,
			health: 100,
			crouched: false,
			lighting: false,
			running: false,
			anomalySteps: {},
			captured: [],
		};

		return client;
	}, [players]);

	return targetPlayer && <Player {...targetPlayer} />;
}
