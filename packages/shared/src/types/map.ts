import type * as THREE from "three";
import type { CardinalDirection, Vec2, Vec3 } from "./util";

export type DoorPoint = {
	position: Vec2;
	direction: CardinalDirection;
};

export type Door = {
	position: Vec2;
	direction: CardinalDirection;
	openable: boolean;
};

export type Light = {
	position: Vec3;
	color?: THREE.ColorRepresentation;
	intensity?: number;
	decay?: number;
	target?: Vec3 | null;
};
