import type { PlayerGameData } from "@mansion/shared/types/player";
import { useAtom, useStore } from "jotai";
import type { Options } from "@/constants/Options";
import {
	bookOpenAtom,
	clientAtom,
	gameDataAtom,
	optionsAtom,
	roomAtom,
	selectorTooltipAtom,
} from "../stores/jotaiStore";

export default function useClient() {
	const [client, setClient] = useAtom(clientAtom);
	const [bookOpen, setBookOpen] = useAtom(bookOpenAtom);
	const [options, setOptions] = useAtom(optionsAtom);
	const [selectorTooltip, setSelectorTooltip] = useAtom(selectorTooltipAtom);
	const [room, setRoom] = useAtom(roomAtom);
	const store = useStore();

	const setOption = (
		option: keyof Options,
		value: string | boolean | number | null | [string | null, string | null],
	) => {
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
		selectorTooltip,
		bookOpen,
		setClient,
		setOption,
		setRoom,
		subGameData,
		setGameData,
		setSelectorTooltip,
		setBookOpen,
	};
}
