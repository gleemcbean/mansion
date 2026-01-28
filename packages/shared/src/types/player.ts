import type { Quat, UUID, Vec3 } from "@/types/util";

export enum PlayerMushroomCapColor {
	Red = "#ed1f45",
	Green = "#19cf40",
	Blue = "#5e29e3",
	Yellow = "#e3ab29",
}

export type PlayerGameData = {
	position: Vec3;
	quaternion: Quat;
	crouched: boolean;
	running: boolean;
	energy: number;
	health: number;
	lighting: boolean;
};

export type PlayerData = {
	mushroomCapColor: PlayerMushroomCapColor;
	gameData?: PlayerGameData;
};

export type Client = {
	uuid: UUID;
	username: string;
	playerData?: PlayerData;
};
