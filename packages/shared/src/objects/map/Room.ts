import type * as THREE from "three";
import type { DoorPoint, Light } from "@/types/map";
import type { CardinalDirection, UUID, Vec2, Vec3 } from "@/types/util";
import { M_GRID_SIZE } from "../../constants/map";

export default class Room {
	public topology: Vec2[] = [];
	public doorPoints: DoorPoint[] = [];
	public doorUUIDs: UUID[] = [];
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

	public updateFromPartial(data: Partial<Room>) {
		if (data.topology) this.topology = data.topology;
		if (data.doorPoints) this.doorPoints = data.doorPoints;
		if (data.doorUUIDs) this.doorUUIDs = data.doorUUIDs;
		if (data.spawns) this.spawns = data.spawns;
		if (data.lights) this.lights = data.lights;
	}

	public clone(): Room {
		const room = new Room(this.id, this.name, this.multiplicity);
		room.topology = [...this.topology];
		room.spawns = [...this.spawns];
		room.doorPoints = [...this.doorPoints];
		room.lights = [...this.lights];
		return room;
	}

	public get modelFilename(): string {
		return `${this.id}.glb`;
	}

	public get pathfindingFilename(): string {
		return `${this.id}.json`;
	}

	public get deadend(): boolean {
		return this.doorPoints.length === 1;
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

	public toGrid() {
		const roomPathfindingData = require(
			`../../constants/pathfinding/${this.id}.json`,
		);

		const newGrid = roomPathfindingData.grid.map((row: boolean[], y: number) =>
			row.map(
				(cell, x) => cell && this.pointIn([x * M_GRID_SIZE, y * M_GRID_SIZE]),
			),
		);

		return newGrid;
	}
}
