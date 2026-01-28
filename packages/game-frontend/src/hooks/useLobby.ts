import type { Client } from "@mansion/shared/types/player";
import type { UUID } from "@mansion/shared/types/util";
import { useAtom } from "jotai";
import {
	anomaliesAtom,
	lobbyMetadataAtom,
	playersAtom,
} from "../stores/jotaiStore";

export default function useLobby() {
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

	return {
		metadata,
		opened: !!metadata,
		players,
		anomalies,
		setMetadata,
		addPlayer,
		removePlayer,
		fillPlayers,
		setAnomalies,
	};
}
