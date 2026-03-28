import type { Vec2 } from "@mansion/shared/types/util";
import type { Grid } from "./grid";
import isWalkable from "./grid";

type Node = {
	pos: Vec2;
	g: number;
	h: number;
	f: number;
	parent: Node | null;
};

class MinHeap {
	private data: Node[] = [];

	get size() {
		return this.data.length;
	}

	push(n: Node) {
		this.data.push(n);
		this._bubbleUp(this.data.length - 1);
	}

	pop(): Node {
		const top = this.data[0]!;
		const last = this.data.pop()!;
		if (this.data.length > 0) {
			this.data[0] = last;
			this._sinkDown(0);
		}
		return top;
	}

	private _bubbleUp(i: number) {
		while (i > 0) {
			const parent = (i - 1) >> 1;
			if (this.data[parent]!.f <= this.data[i]!.f) break;
			[this.data[parent], this.data[i]] = [this.data[i]!, this.data[parent]!];
			i = parent;
		}
	}

	private _sinkDown(i: number) {
		const n = this.data.length;
		while (true) {
			let smallest = i;
			const l = 2 * i + 1;
			const r = 2 * i + 2;
			if (l < n && this.data[l]!.f < this.data[smallest]!.f) smallest = l;
			if (r < n && this.data[r]!.f < this.data[smallest]!.f) smallest = r;
			if (smallest === i) break;
			[this.data[smallest], this.data[i]] = [
				this.data[i]!,
				this.data[smallest]!,
			];
			i = smallest;
		}
	}
}

function heuristic(a: Vec2, b: Vec2): number {
	const dx = Math.abs(a[1] - b[1]);
	const dz = Math.abs(a[0] - b[0]);
	return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
}

export function astar(start: Vec2, goal: Vec2, gridData: Grid): Vec2[] | null {
	const heap = new MinHeap();
	const openMap = new Map<string, Node>();
	const closed = new Set<string>();

	const h0 = heuristic(start, goal);
	const startNode: Node = { pos: start, g: 0, h: h0, f: h0, parent: null };
	heap.push(startNode);
	openMap.set(start.toString(), startNode);

	while (heap.size > 0) {
		const cur = heap.pop();
		const curKey = cur.pos.toString();
		openMap.delete(curKey);

		if (closed.has(curKey)) continue;
		closed.add(curKey);

		if (cur.pos[0] === goal[0] && cur.pos[1] === goal[1]) {
			const path: Vec2[] = [];
			let n: Node | null = cur;
			while (n) {
				path.unshift(n.pos);
				n = n.parent;
			}
			return path;
		}

		for (const [dr, dc] of [
			[-1, 0],
			[1, 0],
			[0, -1],
			[0, 1],
			[-1, -1],
			[-1, 1],
			[1, -1],
			[1, 1],
		] as [number, number][]) {
			const nb: Vec2 = [cur.pos[0] + dr, cur.pos[1] + dc];
			if (!isWalkable(nb, gridData)) continue;
			if (closed.has(nb.toString())) continue;

			if (dr !== 0 && dc !== 0) {
				if (!isWalkable([cur.pos[0], nb[1]], gridData)) continue;
				if (!isWalkable([nb[0], cur.pos[1]], gridData)) continue;
			}

			const moveCost = dr !== 0 && dc !== 0 ? Math.SQRT2 : 1;
			const tentativeG = cur.g + moveCost;
			const existing = openMap.get(nb.toString());
			if (existing && tentativeG >= existing.g) continue;

			const h = heuristic(nb, goal);
			const node: Node = {
				pos: nb,
				g: tentativeG,
				h,
				f: tentativeG + h,
				parent: cur,
			};

			heap.push(node);
			openMap.set(nb.toString(), node);
		}
	}

	return null;
}
