import { LobbyState } from "@mansion/shared/types/lobby";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import { useEffect } from "react";
import Game from "./game/Game";
import useClient from "./hooks/useClient";
import useLobby from "./hooks/useLobby";
import useWebsocket from "./hooks/useWebsocket";
import Loading from "./ui/modals/Loading";
import Router from "./ui/Router";

export default function App() {
	const { addHandler, send } = useWebsocket();
	const { setClient, client } = useClient();
	const { setMetadata, fillPlayers, metadata } = useLobby();

	function getAndDeleteCookie(name: string) {
		const value =
			document.cookie
				.split("; ")
				.find((r) => r.startsWith(`${name}=`))
				?.split("=")[1] ?? null;

		if (value !== null) {
			document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
		}

		return value ? decodeURIComponent(value) : null;
	}

	useEffect(() => {
		const unsubscribes = [
			addHandler(ServerPacketType.Initialize, (client) => {
				setClient(client);

				const code = getAndDeleteCookie("code");

				if (code) {
					send(ClientPacketType.JoinGame, { code });
				} else {
					unsubscribes.forEach((u) => {
						u();
					});
				}
			}),
			addHandler(ServerPacketType.InvalidCode, () => {
				alert("Invalid code");

				unsubscribes.forEach((u) => {
					u();
				});
			}),
			addHandler(
				ServerPacketType.GameJoined,
				({ metadata, players, playerData }) => {
					setMetadata(metadata);
					fillPlayers(players);
					client.playerData = playerData;
					setClient(client);
					close();
				},
			),
		];

		send(ClientPacketType.Ready);

		return () => {
			unsubscribes.forEach((u) => {
				u();
			});
		};
	}, []);

	if (!client) return <Loading />;
	if (metadata?.state === LobbyState.InGame) return <Game />;
	return (
		<main>
			<section>
				<video autoPlay muted loop src="/videos/background.mp4" />
			</section>
			<Router />
		</main>
	);
}
