import type { Vec2, Vec3 } from "@/types/util";

export function transform2dVec(vec: Vec3): Vec2 {
	return [vec[0], vec[2]];
}

export function transform3dVec(vec: Vec2, y: number): Vec3 {
	return [vec[0], y, vec[1]];
}
