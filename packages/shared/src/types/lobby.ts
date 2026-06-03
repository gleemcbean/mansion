import type { UUID } from "./util";

export enum LobbyState {
	Waiting = "waiting",
	InGame = "in-game",
	Finished = "finished",
}

export type LobbyMetadata = {
	code: string;
	ownerUUID: UUID;
	state: LobbyState;
};
