import type { Vec2 } from "@/types/util";
import Triangle from "./Triangle";

export interface PolygonInterface {
	get area(): number;
	randomPoint(): Vec2;
}

export default class Polygon implements PolygonInterface {
	public constructor(public topology: Vec2[] = []) {}

	public get area(): number {
		let area = 0;
		const n = this.topology.length;

		for (let i = 0; i < n; i++) {
			const [x1, y1] = this.topology[i] as Vec2;
			const [x2, y2] = this.topology[(i + 1) % n] as Vec2;
			area += x1 * y2 - x2 * y1;
		}

		return Math.abs(area) / 2;
	}

	public pointIn([x, y]: Vec2): boolean {
		let inside = false;
		const n = this.topology.length;

		for (let i = 0, j = n - 1; i < n; j = i++) {
			const [xi, yi] = this.topology[i] as Vec2;
			const [xj, yj] = this.topology[j] as Vec2;
			const intersect =
				yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

			if (intersect) inside = !inside;
		}

		return inside;
	}

	private isConvex(prev: Vec2, curr: Vec2, next: Vec2): boolean {
		return (
			(curr[0] - prev[0]) * (next[1] - prev[1]) -
				(curr[1] - prev[1]) * (next[0] - prev[0]) >
			0
		);
	}

	private triangulate() {
		if (this.topology.length < 3) return [];

		const poly =
			new Polygon(this.topology).area < 0
				? structuredClone(this.topology).reverse()
				: structuredClone(this.topology);

		const triangles: Triangle[] = [];
		const verts = poly.map((_, i) => i);

		while (verts.length > 3) {
			let earFound = false;

			for (let i = 0; i < verts.length; i++) {
				const prevIndex = verts[(i - 1 + verts.length) % verts.length]!;
				const currIndex = verts[i]!;
				const nextIndex = verts[(i + 1) % verts.length]!;

				const prev = poly[prevIndex]!;
				const curr = poly[currIndex]!;
				const next = poly[nextIndex]!;

				if (!this.isConvex(prev, curr, next)) continue;

				let hasPointInside = false;

				for (let j = 0; j < verts.length; j++) {
					const testIndex = verts[j]!;
					if ([prevIndex, currIndex, nextIndex].includes(testIndex)) continue;

					if (new Polygon([prev, curr, next]).pointIn(poly[testIndex]!)) {
						hasPointInside = true;
						break;
					}
				}

				if (hasPointInside) continue;

				triangles.push(new Triangle([prev, curr, next]));
				verts.splice(i, 1);
				earFound = true;
				break;
			}

			if (!earFound) {
				throw new Error(
					"Polygon is probably self-intersecting or invalid (no ear found).",
				);
			}
		}

		triangles.push(
			new Triangle([poly[verts[0]!]!, poly[verts[1]!]!, poly[verts[2]!]!]),
		);

		return triangles;
	}

	public randomPoint() {
		const triangles = this.triangulate();

		const areas = triangles.map((t) => t.area);
		const totalArea = areas.reduce((acc, curr) => acc + curr, 0);

		let r = Math.random() * totalArea;

		for (let i = 0; i < triangles.length; i++) {
			r -= areas[i]!;
			if (r <= 0) return triangles[i]!.randomPoint();
		}

		return triangles[triangles.length - 1]!.randomPoint();
	}
}
