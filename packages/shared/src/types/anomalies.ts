import type { Vec3 } from "./util";

export enum AnomalyState {
	Roam,
	Move,
	Chase,
}

export type Anomaly = {
	id: string;
	name: string;
	description: string;
	position: Vec3;
	rotation: Vec3;
	state: AnomalyState;
	syllables: [string, string, string];
	entity_data: Record<string, any>;
};
