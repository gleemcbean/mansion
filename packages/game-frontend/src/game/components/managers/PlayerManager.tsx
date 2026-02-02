import { ServerPacketType } from "@mansion/shared/types/packets";
import type { Client } from "@mansion/shared/types/player";
import React, { useEffect, useState } from "react";
import useClient from "@/hooks/useClient";
import useLobby from "@/hooks/useLobby";
import useWebsocket from "@/hooks/useWebsocket";
import Player from "../entities/Player";

export default function PlayerManager() {
	const { players: _players, addPlayer, removePlayer } = useLobby();
	const { addHandler } = useWebsocket();
	const { client } = useClient();
	const [players, setPlayers] = useState(_players);

	useEffect(() => {
		const unsubscribes = [
			addHandler(ServerPacketType.PlayerJoined, ({ player }) => {
				addPlayer(player);
			}),
			addHandler(ServerPacketType.PlayerLeft, ({ uuid }) => {
				removePlayer(uuid);
			}),
			addHandler(ServerPacketType.PlayerUpdate, ({ uuid, client }) => {
				players.set(uuid, client);
				setPlayers(new Map(players));
			}),
		];

		return () =>
			unsubscribes.forEach((u) => {
				u();
			});
	}, []);

	return (
		<React.Fragment>
			{Array.from(players.values())
				.filter((p) => p.playerData?.gameData && p.uuid !== client.uuid)
				.map((p) => (
					<Player key={p.uuid} {...(p as Required<Client>)} />
				))}
		</React.Fragment>
	);
}
