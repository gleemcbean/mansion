import type GameMap from "@/objects/map/GameMap";
import type { UUID } from "./util";

export enum LobbyState {
	Waiting = "waiting",
	InGame = "in-game",
	Finished = "finished",
}

export type LobbyMetadata = {
	code: string;
	ownerUuid: UUID;
	state: LobbyState;
	map: GameMap | null;
};
