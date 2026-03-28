import type { Anomaly } from "@mansion/shared/types/anomalies";
import type { Client } from "@mansion/shared/types/player";
import type { Vec3 } from "@mansion/shared/types/util";
import { useMemo } from "react";
import * as THREE from "three";
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
			quaternion: [0, 0, 0, 1],
			energy: 100,
			health: 100,
			crouched: false,
			lighting: false,
			running: false,
			anomalySteps: {},
			captured: [],
		};

		return client;
	}, []);

	const playerData = useMemo(() => {
		if (!targetPlayer.playerData.gameData) return;
		const player = structuredClone(targetPlayer);
		const gameData = player.playerData.gameData!;

		const viewQuat = new THREE.Quaternion().setFromEuler(
			new THREE.Euler(...(data.rotation as Vec3)),
		);

		gameData.position = data.position;
		gameData.quaternion = [viewQuat.x, viewQuat.y, viewQuat.z, viewQuat.w];

		return player as Required<Client>;
	}, [data, targetPlayer.playerData.gameData]);

	return playerData && <Player {...playerData} />;
}
