import type { Vec2 } from "@/types/util";
import type { PolygonInterface } from "./Polygon";

export default class Triangle implements PolygonInterface {
	constructor(public topology: [Vec2, Vec2, Vec2]) {
		if (this.topology.length !== 3) {
			throw new Error("This is not a triangle");
		}
	}

	public get area(): number {
		const [a, b, c] = this.topology;

		return (
			Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) /
			2
		);
	}

	public randomPoint(): Vec2 {
		let r1 = Math.random();
		let r2 = Math.random();

		const [a, b, c] = this.topology as [Vec2, Vec2, Vec2];

		if (r1 + r2 > 1) {
			r1 = 1 - r1;
			r2 = 1 - r2;
		}

		return [
			a[0] + r1 * (b[0] - a[0]) + r2 * (c[0] - a[0]),
			a[1] + r1 * (b[1] - a[1]) + r2 * (c[1] - a[1]),
		];
	}
}
