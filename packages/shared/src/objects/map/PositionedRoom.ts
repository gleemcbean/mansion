import type { DoorPoint, Light } from "@/types/map";
import type { CardinalDirection, UUID, Vec2 } from "@/types/util";
import { M_GRID_SIZE } from "../../constants/map";
import Room from "./Room";

type TranslateReturn<T> = T extends undefined
	? Vec2
	: [number, number, CardinalDirection];

const EPS = 1e-6;

export default class PositionedRoom extends Room {
	public uuid: UUID;
	public position: Vec2;
	public direction: CardinalDirection;
	public anomalies: string[] = [];

	public static translateFromDirection(
		direction: CardinalDirection,
		[x, y]: Vec2,
	): Vec2 {
		const angle = (Math.PI / 2) * direction;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const tx = Math.round((x * cos - y * sin) * 100) / 100;
		const ty = Math.round((x * sin + y * cos) * 100) / 100;
		return [tx, ty];
	}

	public static override fromJSON(obj: Object): PositionedRoom {
		try {
			const room = new PositionedRoom(new Room("", ""), "0-0-0-0-0-0");
			Object.assign(room, obj);
			return room;
		} catch {
			throw new Error("Invalid PositionedRoom JSON");
		}
	}

	public constructor(
		room: Room,
		uuid: UUID,
		position: Vec2 = [0, 0],
		direction: CardinalDirection = Math.floor(
			Math.random() * 4,
		) as CardinalDirection,
	) {
		super(room.id, room.name, room.multiplicity);
		this.uuid = uuid;
		this.topology = [...room.topology];
		this.spawns = [...room.spawns];
		this.doorPoints = [...room.doorPoints];
		this.lights = [...room.lights];
		this.position = position;
		this.direction = direction;
	}

	public override updateFromPartial(data: Partial<PositionedRoom>) {
		super.updateFromPartial(data);
		if (data.position) this.position = data.position;
		if (data.direction !== undefined) this.direction = data.direction;
		if (data.anomalies) this.anomalies = data.anomalies;
	}

	public translate<T extends CardinalDirection | undefined>(
		[x, y]: Vec2,
		direction: T = undefined as T,
	): TranslateReturn<T> {
		const [px, py] = this.position;

		let [tx, ty] = PositionedRoom.translateFromDirection(this.direction, [
			x,
			y,
		]);

		tx += px;
		ty += py;

		if (direction !== undefined) {
			direction = (((direction as T & {}) + this.direction) % 4) as T;
			return [tx, ty, direction] as TranslateReturn<T>;
		}

		return [tx, ty] as TranslateReturn<T>;
	}

	public override randomDoorPoint(): DoorPoint {
		const index = Math.floor(Math.random() * this.t_doorPoints.length);
		const doorPoint = this.t_doorPoints[index] as DoorPoint;
		return doorPoint;
	}

	public override shuffledDoorPoints(): DoorPoint[] {
		const array = [...this.t_doorPoints];

		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j] as DoorPoint, array[i] as DoorPoint];
		}

		return array;
	}

	private isPointOnSegment(p: Vec2, a: Vec2, b: Vec2) {
		const [px, py] = p;
		const [ax, ay] = a;
		const [bx, by] = b;

		const cross = (py - ay) * (bx - ax) - (px - ax) * (by - ay);
		if (Math.abs(cross) > EPS) return false;

		const minX = Math.min(ax, bx) - EPS;
		const maxX = Math.max(ax, bx) + EPS;
		const minY = Math.min(ay, by) - EPS;
		const maxY = Math.max(ay, by) + EPS;
		return px >= minX && px <= maxX && py >= minY && py <= maxY;
	}

	public t_pointIn(point: Vec2): boolean {
		const [px, py] = point;
		const translated = this.t_topology;
		let inside = false;
		const n = translated.length;

		for (let i = 0; i < n; i++) {
			const a = translated[i] as Vec2;
			const b = translated[(i + 1) % n] as Vec2;
			if (this.isPointOnSegment(point, a, b)) return false;
		}

		for (let i = 0, j = n - 1; i < n; j = i++) {
			const [xi, yi] = translated[i] as Vec2;
			const [xj, yj] = translated[j] as Vec2;

			const intersect =
				yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

			if (intersect) inside = !inside;
		}

		return inside;
	}

	public intersects(other: PositionedRoom): boolean {
		return this.boundaryPointsInside(other) || other.boundaryPointsInside(this);
	}

	private boundaryPointsInside(other: PositionedRoom): boolean {
		const t_topology = this.t_topology;

		for (let i = 0; i < t_topology.length; i++) {
			const [x1, y1] = t_topology[i] as Vec2;
			const [x2, y2] = t_topology[(i + 1) % t_topology.length] as Vec2;
			const distance = Math.hypot(x2 - x1, y2 - y1);

			for (let d = 0; d < distance; d += 0.5) {
				const t = d / distance;
				const x = x1 + (x2 - x1) * t;
				const y = y1 + (y2 - y1) * t;
				if (other.t_pointIn([x, y])) return true;
			}
		}

		return false;
	}

	public get t_topology(): Vec2[] {
		return this.topology.map((vec) => this.translate(vec)) as Vec2[];
	}

	public get t_doorPoints(): DoorPoint[] {
		return this.doorPoints.map(({ position, direction }) => {
			const [tx, ty, tDirection] = this.translate(position, direction);
			return { position: [tx, ty], direction: tDirection };
		});
	}

	public get t_spawns(): Vec2[] {
		return this.spawns.map((vec) => this.translate(vec)) as Vec2[];
	}

	public get t_lights(): Light[] {
		return this.lights.map((light) => {
			light = { ...light };
			let [lx, ly, lz] = light.position;
			[lx, lz] = this.translate([lx, lz]);
			light.position = [lx, ly, lz];

			if (light.target) {
				let [tx, ty, tz] = light.target;
				[tx, tz] = this.translate([lx + tx, lz + tz]);
				light.target = [tx, ty, tz];
			}

			return light;
		});
	}

	public get t_bounds(): {
		min: Vec2;
		max: Vec2;
		width: number;
		height: number;
	} {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const [x, y] of this.t_topology) {
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}

		return {
			min: [minX, minY],
			max: [maxX, maxY],
			width: maxX - minX,
			height: maxY - minY,
		};
	}

	public t_toGrid(): boolean[][] {
		const localGrid: boolean[][] = super.toGrid();
		const localRows = localGrid.length;
		const localCols = localGrid[0]?.length ?? 0;

		const {
			min: [minX, minY],
			width,
			height,
		} = this.t_bounds;
		const cols = Math.round(width / M_GRID_SIZE);
		const rows = Math.round(height / M_GRID_SIZE);

		const grid: boolean[][] = Array.from({ length: rows }, () =>
			new Array(cols).fill(false),
		);

		const invDir = ((4 - this.direction) % 4) as CardinalDirection;
		const [px, py] = this.position;

		for (let gy = 0; gy < rows; gy++) {
			for (let gx = 0; gx < cols; gx++) {
				const wx = minX + (gx + 0.5) * M_GRID_SIZE;
				const wy = minY + (gy + 0.5) * M_GRID_SIZE;

				const [lx, ly] = PositionedRoom.translateFromDirection(invDir, [
					wx - px,
					wy - py,
				]);

				const lGX = Math.floor(lx / M_GRID_SIZE);
				const lGY = Math.floor(ly / M_GRID_SIZE);

				if (lGY >= 0 && lGY < localRows && lGX >= 0 && lGX < localCols) {
					grid[gy]![gx] = localGrid[lGY]![lGX] ?? false;
				}
			}
		}

		return grid;
	}

	public toJSON() {
		return {
			uuid: this.uuid,
			id: this.id,
			name: this.name,
			multiplicity: this.multiplicity,
			topology: this.topology,
			spawns: this.spawns,
			doorPoints: this.doorPoints,
			lights: this.lights,
			position: this.position,
			direction: this.direction,
			anomalies: this.anomalies,
		};
	}
}
