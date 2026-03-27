import type { Vec3 } from "@/types/util";
import type { PlayerGameData } from "../types/player";
import type { GameMap } from "./Map";

export type AnomalyState = "roam" | "follow" | "attack";

export default abstract class Anomaly {
	public position: Vec3 = [0, 0, 0];
	public rotation: Vec3 = [0, 0, 0];
	public state: AnomalyState = "roam";

	protected abstract shouldFollow(players: PlayerGameData[]): boolean;
  	protected abstract shouldAttack(players: PlayerGameData[]): boolean;
  	protected abstract shouldRoam(players: PlayerGameData[]): boolean;

	public static id: string;
	public static name: string;
	public static description: string;

	public abstract update(
		map: GameMap,
		players: PlayerGameData[],
		deltaTime: number,
	): void;

	protected updateState(players: PlayerGameData[]): void {
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

	protected setState(next: AnomalyState): void {
		if (this.state === next) return;
		this.onStateExit(this.state);
		this.state = next;
		this.onStateEnter(next);
	}

	protected onStateEnter(_state: AnomalyState): void {}
	protected onStateExit(_state: AnomalyState): void {}

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
		};
	}
}
