import SYLLABLES from "@mansion/shared/constants/syllables";
import type { Vec3 } from "@mansion/shared/types/util";
import type { WSClient, WSData } from "@/ws/types";
import type { PlayerGameData } from "../../../shared/src/types/player";
import type { GameMap } from "../../../shared/src/utils/Map";

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

export type AnomalyState = "roam" | "follow" | "attack";

export default abstract class Anomaly {
	public position: Vec3 = [0, 0, 0];
	public rotation: Vec3 = [0, 0, 0];
	public state: AnomalyState = "roam";
	public syllables: [string, string, string] = composeSyllables();

	public static id: string;
	public static name: string;
	public static description: string;

	public abstract shouldFollow(players: PlayerGameData[]): boolean;
	public abstract shouldAttack(players: PlayerGameData[]): boolean;
	public abstract shouldRoam(players: PlayerGameData[]): boolean;

	public updateState(players: PlayerGameData[]): void {
		switch (this.state) {
		case "roam":
			if (this.shouldFollow(players)) this.setState("follow");
			break;
		case "follow":
			if (this.shouldAttack(players)) this.setState("attack");
			else if (this.shouldRoam(players)) this.setState("roam");
			break;
		case "attack":
			if (this.shouldRoam(players)) this.setState("roam");
			else if (this.shouldFollow(players)) this.setState("follow");
			break;
		}
	}

	public setState(next: AnomalyState): void {
		if (this.state === next) return;
		this.onStateExit(this.state);
		this.state = next;
		this.onStateEnter(next);
	}

	public onStateEnter(_state: AnomalyState): void {}
	public onStateExit(_state: AnomalyState): void {}

	public abstract update(
		ws: Bun.ServerWebSocket<WSData>,
		map: GameMap,
		players: WSClient[],
		deltaTime: number,
	): void;

	public abstract spawn(map: GameMap): [Vec3, Vec3] | null;

	public abstract canCastSpell(playerData: PlayerGameData): boolean;

	public get id() {
		return (this.constructor as typeof Anomaly).id;
	}

	public get name() {
		return (this.constructor as typeof Anomaly).name;
	}

	public get description() {
		return (this.constructor as typeof Anomaly).description;
	}

	public get entityData(): Record<string, any> {
		return {};
	}

	public toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			position: this.position,
			rotation: this.rotation,
			syllables: this.syllables,
			entity_data: this.entityData,
		};
	}
}
