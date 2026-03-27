import type { Quat, Vec3 } from "./util";

export type Anomaly = {
	id: string;
	name: string;
	description: string;
	position: Vec3;
	rotation: Quat;
	syllables: [string, string, string];
	entity_data: Record<string, any>;
};
