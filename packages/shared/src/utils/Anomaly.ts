import { SYLLABLES } from "@/constants/anomalies";
import type { Vec3 } from "@/types/util";
import type { PlayerGameData } from "../types/player";
import type { GameMap } from "./Map";

function composeSyllables(): [string, string, string] {
	const syllables: string[] = [];
	const batch = [...SYLLABLES];

	for (let i = 0; i < 3; i++) {
		syllables.push(
			batch.splice(Math.floor(Math.random() * batch.length), 1)[0]!,
		);
	}

	return syllables as [string, string, string];
}

export default abstract class Anomaly {
	public position: Vec3 = [0, 0, 0];
	public rotation: Vec3 = [0, 0, 0];
	public syllables: [string, string, string] = composeSyllables();

	public static id: string;
	public static name: string;
	public static description: string;

	public abstract update(
		map: GameMap,
		players: PlayerGameData[],
		deltaTime: number,
	): void;

	public abstract spawn(map: GameMap): [Vec3, Vec3] | null;

	public get id() {
		return (this.constructor as typeof Anomaly).id;
	}

	public get name() {
		return (this.constructor as typeof Anomaly).name;
	}

	public get description() {
		return (this.constructor as typeof Anomaly).description;
	}

	public toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			position: this.position,
			rotation: this.rotation,
			syllables: this.syllables,
		};
	}
}
