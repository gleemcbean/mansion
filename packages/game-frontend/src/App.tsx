import { useEffect } from "react";
import Router from "./ui/Router";
import useWebsocket from "./hooks/useWebsocket";
import {
  ClientPacketType,
  ServerPacketType,
} from "@mansion/shared/types/packets";
import useClient from "./hooks/useClient";
import Loading from "./ui/modals/Loading";
import useLobby from "./hooks/useLobby";
import Game from "./game/Game";
import { LobbyState } from "@mansion/shared/types/lobby";

export default function App() {
  const { addHandler, send } = useWebsocket();
  const { setClient, client } = useClient();
  const { metadata } = useLobby();

  useEffect(() => {
    const unsubscribe = addHandler(ServerPacketType.Initialize, (client) => {
      setClient(client);
      unsubscribe();
    });

    send(ClientPacketType.Ready);

    return () => unsubscribe();
  }, []);

  if (!client) return <Loading />;
  if (metadata?.state === LobbyState.InGame) return <Game />;
  return <Router />;
}
