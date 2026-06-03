import type { Anomaly } from "@mansion/shared/types/anomalies";
import type { Client } from "@mansion/shared/types/player";
import type { UUID } from "@mansion/shared/types/util";
import { useAtom } from "jotai";
import {
	anomaliesAtom,
	lobbyMapAtom,
	lobbyMetadataAtom,
	playersAtom,
} from "../stores/jotaiStore";

export default function useLobby() {
	const [map, setMap] = useAtom(lobbyMapAtom);
	const [metadata, setMetadata] = useAtom(lobbyMetadataAtom);
	const [players, setPlayers] = useAtom(playersAtom);
	const [anomalies, setAnomalies] = useAtom(anomaliesAtom);

	const addPlayer = (player: Client) => {
		setPlayers((prev) => {
			const next = new Map(prev);
			next.set(player.uuid, player);
			return next;
		});
	};

	const removePlayer = (uuid: UUID) => {
		setPlayers((prev) => {
			const next = new Map(prev);
			next.delete(uuid);
			return next;
		});
	};

	const fillPlayers = (list: Client[]) => {
		const next = new Map<UUID, Client>();
		for (const p of list) next.set(p.uuid, p);
		setPlayers(next);
	};

	const fillAnomalies = (list: Anomaly[]) => {
		const next = new Map<string, Anomaly>();
		for (const a of list) next.set(a.id, a);
		setAnomalies(next);
	};

	return {
		metadata,
		opened: !!metadata,
		players,
		anomalies,
		map,
		setMetadata,
		addPlayer,
		removePlayer,
		fillPlayers,
		fillAnomalies,
		setMap,
	};
}
