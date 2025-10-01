import { useAtom, useStore } from "jotai";
import {
  clientAtom,
  gameDataAtom,
  optionsAtom,
  roomAtom,
} from "../stores/jotaiStore";
import type { Options } from "@/constants/Options";
import type { PlayerGameData } from "@mansion/shared/types/player";

export default function useClient() {
  const [client, setClient] = useAtom(clientAtom);
  const [options, setOptions] = useAtom(optionsAtom);
  const [room, setRoom] = useAtom(roomAtom);
  const store = useStore();

  const setOption = (option: keyof Options, value: any) => {
    setOptions((prev) => ({ ...prev, [option]: value }));
  };

  const subGameData = (callback: (data: PlayerGameData) => void) => {
    return store.sub(gameDataAtom, () => {
      const data = store.get(gameDataAtom);
      if (data) callback(data);
    });
  };

  const setGameData = (data: PlayerGameData) => {
    store.set(gameDataAtom, data);
  };

  return {
    client: client!,
    options,
    room,
    setClient,
    setOption,
    setRoom,
    subGameData,
    setGameData,
  };
}
