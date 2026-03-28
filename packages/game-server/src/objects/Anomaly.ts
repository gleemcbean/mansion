import type GameMap from "@mansion/shared/objects/map/GameMap";
import type { Vec3 } from "@mansion/shared/types/util";
import composeSyllables from "@/utils/composeSyllables";
import type { WSClient, WSData } from "@/ws/types";
import type { PlayerGameData } from "../../../shared/src/types/player";

export enum AnomalyState {
	Roam,
	Move,
	Chase,
}

export default abstract class Anomaly {
	public position: Vec3 = [0, 0, 0];
	public rotation: Vec3 = [0, 0, 0];
	public state: AnomalyState = AnomalyState.Roam;
	public syllables: [string, string, string] = composeSyllables();

	public static id: string;
	public static name: string;
	public static description: string;

	public constructor(protected ws: Bun.ServerWebSocket<WSData>) {}

	public abstract update(players: WSClient[], deltaTime: number): void;
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
