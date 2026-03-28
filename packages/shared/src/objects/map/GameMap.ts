import type { UUID } from "node:crypto";
import type { Door } from "@/types/map";
import type { Vec2 } from "@/types/util";
import { M_GRID_SIZE } from "../../constants/map";
import PositionedRoom from "./PositionedRoom";

export default class GameMap {
	public usedSpawns: Vec2[] = [];
	private grid: boolean[][] | null = null;

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

	public roomAt(position: Vec2): PositionedRoom | null {
		for (const room of this.rooms) {
			if (room.t_pointIn(position)) return room;
		}

		return null;
	}

	public getDoor(doorUuid: UUID): Door | null {
		return this.doors.find((d) => d.uuid === doorUuid) ?? null;
	}

	public getRoom(roomUuid: UUID): PositionedRoom | null {
		return this.rooms.find((d) => d.uuid === roomUuid) ?? null;
	}

	public get bounds(): { min: Vec2; max: Vec2; width: number; height: number } {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const room of this.rooms) {
			const { min, max } = room.t_bounds;
			if (min[0] < minX) minX = min[0];
			if (max[0] > maxX) maxX = max[0];
			if (min[1] < minY) minY = min[1];
			if (max[1] > maxY) maxY = max[1];
		}

		return {
			min: [minX, minY],
			max: [maxX, maxY],
			width: maxX - minX,
			height: maxY - minY,
		};
	}

	public get doorCount() {
		return this.doors.length;
	}

	public toGrid(): boolean[][] {
		if (this.grid) return this.grid;

		const {
			min: [minX, minY],
			width,
			height,
		} = this.bounds;

		const cols = Math.round(width / M_GRID_SIZE);
		const rows = Math.round(height / M_GRID_SIZE);

		const grid: boolean[][] = Array.from({ length: rows }, () =>
			new Array(cols).fill(false),
		);

		for (const room of this.rooms) {
			const {
				min: [minRoomX, minRoomY],
			} = room.t_bounds;
			const roomGrid = room.t_toGrid();

			const offsetY = Math.round((minRoomY - minY) / M_GRID_SIZE);
			const offsetX = Math.round((minRoomX - minX) / M_GRID_SIZE);

			for (let gy = 0; gy < roomGrid.length; gy++) {
				const row = roomGrid[gy];
				if (!row) continue;

				for (let gx = 0; gx < row.length; gx++) {
					if (!row[gx]) continue;
					const globalY = offsetY + gy;
					const globalX = offsetX + gx;

					if (
						globalY >= 0 &&
						globalY < rows &&
						globalX >= 0 &&
						globalX < cols
					) {
						grid[globalY]![globalX] = true;
					}
				}
			}
		}

		this.grid = grid;
		return grid;
	}

	public randomPoint(): Vec2 {
		const bounds = this.bounds;
		const grid = this.toGrid();
		const coords: Vec2[] = [];

		for (let y = 0; y < bounds.height / M_GRID_SIZE; y++) {
			for (let x = 0; x < bounds.width / M_GRID_SIZE; x++) {
				if (!grid[y]?.[x]) continue;

				coords.push([
					x * M_GRID_SIZE + this.bounds.min[0],
					y * M_GRID_SIZE + this.bounds.min[1],
				]);
			}
		}

		return coords[Math.floor(Math.random() * coords.length)]!;
	}
}
