import type * as THREE from "three";
import type { Door, DoorPoint, Light } from "../types/map";
import type { CardinalDirection, Vec2, Vec3 } from "../types/util";

type TranslateReturn<T> = T extends undefined
	? Vec2
	: [number, number, CardinalDirection];

const EPS = 1e-6;

export class GameMap {
	public usedSpawns: Vec2[] = [];

	public static fromJSON(obj: Object): GameMap {
		try {
			const map = new GameMap();
			Object.assign(map, obj);
			map.rooms = map.rooms.map((r) => PositionedRoom.fromJSON(r));
			return map;
		} catch {
			throw new Error("Invalid GameMap JSON");
		}
	}

	public constructor(
		public rooms: PositionedRoom[] = [],
		public doors: Door[] = [],
	) {}

	public randomSpawn(): Vec2 | null {
		const availableSpawns = this.rooms
			.flatMap((room) => room.t_spawns)
			.filter(
				(s) => !this.usedSpawns.some((u) => u[0] === s[0] && u[1] === s[1]),
			);

		if (availableSpawns.length === 0) return null;

		const randomIndex = Math.floor(Math.random() * availableSpawns.length);
		const spawn = availableSpawns[randomIndex] as Vec2;
		this.usedSpawns.push(spawn);
		return spawn;
	}

	public doorAt(position: Vec2): Door | null {
		for (const door of this.doors) {
			if (
				door.position[0] === position[0] &&
				door.position[1] === position[1]
			) {
				return door;
			}
		}

		return null;
	}

	public bounds(): { min: Vec2; max: Vec2 } {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const room of this.rooms) {
			for (const [x, y] of room.t_topology) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}

		return { min: [minX, minY], max: [maxX, maxY] };
	}
}

export class Room {
	public doorPoints: DoorPoint[] = [];
	public topology: Vec2[] = [];
	public spawns: Vec2[] = [];
	public lights: Light[] = [];

	public static fromJSON(obj: Object): Room {
		try {
			const room = new Room("", "");
			Object.assign(room, obj);
			return room;
		} catch {
			throw new Error("Invalid Room JSON");
		}
	}

	public constructor(
		public id: string,
		public name: string,
		public multiplicity: number = 1,
	) {}

	public setTopology(...topology: Vec2[]): this {
		this.topology = topology;
		return this;
	}

	public addDoorPoint(
		x: number,
		y: number,
		direction: CardinalDirection,
	): this {
		this.doorPoints.push({
			position: [x, y],
			direction,
		});

		return this;
	}

	public addLight(
		x: number,
		y: number,
		z: number,
		options: {
			color?: THREE.ColorRepresentation;
			decay?: number;
			intensity?: number;
			target?: Vec3;
		} = {},
	) {
		this.lights.push({
			position: [x, y, z],
			color: options.color,
			decay: options.decay,
			intensity: options.intensity,
			target: options.target,
		});

		return this;
	}

	public addSpawn(x: number, y: number): this {
		const spawn: Vec2 = [x, y];
		this.spawns.push(spawn);
		return this;
	}

	public randomDoorPoint(): DoorPoint {
		return this.shuffledDoorPoints()[0] as DoorPoint;
	}

	public shuffledDoorPoints(): DoorPoint[] {
		const array = [...this.doorPoints];
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j] as DoorPoint, array[i] as DoorPoint];
		}

		return array;
	}

	public clone(): Room {
		const room = new Room(this.id, this.name, this.multiplicity);
		room.topology = [...this.topology];
		room.spawns = [...this.spawns];
		room.doorPoints = [...this.doorPoints];
		room.lights = [...this.lights];
		return room;
	}

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

	public get filename(): string {
		return `${this.id}.glb`;
	}

	public get deadend(): boolean {
		return this.doorPoints.length === 1;
	}
}

export class PositionedRoom extends Room {
	public position: Vec2;
	public direction: CardinalDirection;

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
			const room = new PositionedRoom(new Room("", ""));
			Object.assign(room, obj);
			return room;
		} catch {
			throw new Error("Invalid PositionedRoom JSON");
		}
	}

	public constructor(
		room: Room,
		position: Vec2 = [0, 0],
		direction: CardinalDirection = Math.floor(
			Math.random() * 4,
		) as CardinalDirection,
	) {
		super(room.id, room.name, room.multiplicity);
		this.topology = [...room.topology];
		this.spawns = [...room.spawns];
		this.doorPoints = [...room.doorPoints];
		this.lights = [...room.lights];
		this.position = position;
		this.direction = direction;
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

	public pointIn(point: Vec2): boolean {
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
		const pointRing: Vec2[] = [];
		const t_topology = this.t_topology;

		for (let i = 0; i < t_topology.length; i++) {
			const [x1, y1] = t_topology[i] as Vec2;
			const [x2, y2] = t_topology[(i + 1) % t_topology.length] as Vec2;
			const distance = Math.hypot(x2 - x1, y2 - y1);

			for (let d = 0; d < distance; d += 0.5) {
				const t = d / distance;
				const x = x1 + (x2 - x1) * t;
				const y = y1 + (y2 - y1) * t;
				pointRing.push([x, y]);
			}
		}

		for (const point of pointRing) {
			if (other.pointIn(point)) return true;
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
}
