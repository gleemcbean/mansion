import { CardinalDirection } from "@/types/util";
import { Room } from "@/utils/Map";

// biome-ignore format: Rooms are more readable this way
export const ROOMS: ReadonlyArray<Room> = Object.freeze([
	new Room("kitchen", "Kitchen", 2)
		.setTopology([0, 0], [7, 0], [7, 4], [4, 4], [4, 5], [0, 5])
		.addDoorPoint(1.5, 0, CardinalDirection.South)
		.addDoorPoint(5.5, 4, CardinalDirection.North)
		.addSpawn(2, 3)
		.addLight(6.5, 2, 3.5),
	new Room("attics", "Attics", 2)
		.setTopology([0, 0], [5, 0], [5, 2], [3, 2], [3, 5], [0, 5])
		.addDoorPoint(0, 1.5, CardinalDirection.East)
		.addSpawn(3, 1),
	new Room("bedroom1", "Bedroom", 2)
		.setTopology([0, 0], [6, 0], [6, 4], [4, 4], [4, 3], [0, 3])
		.addDoorPoint(0, 2.5, CardinalDirection.East)
		.addSpawn(1, 1)
		// .addLight(1.5, 1.2, 0.25, { intensity: 2, decay: 2, color: 0x56f59b, target: [0, -0.5, 0] })
		.addLight(5.75, 1, 1.6, { intensity: 3 }),
	new Room("bedroom2", "Bedroom", 2)
		.setTopology([0, 0], [5, 0], [5, 3], [4, 3], [4, 5], [0, 5])
		.addDoorPoint(5, 1.5, CardinalDirection.West)
		.addLight(4.5, 2, 2.5, { intensity: 3 })
		.addSpawn(3, 4),
	new Room("corridor", "Corridor")
		.setTopology([0, 0], [9, 0], [9, 3], [0, 3])
		.addDoorPoint(0, 1.5, CardinalDirection.East)
		.addDoorPoint(2.5, 0, CardinalDirection.South)
		.addDoorPoint(6.5, 0, CardinalDirection.South)
		.addDoorPoint(9, 1.5, CardinalDirection.West)
		.addDoorPoint(6.5, 3, CardinalDirection.North)
		.addDoorPoint(2.5, 3, CardinalDirection.North)
		.addLight(1.5, 1.6, 0.5, { intensity: 3, color: 0xC7001B })
		.addLight(1.5, 1.6, 2.5, { intensity: 3, color: 0xC7001B })
		.addLight(3.5, 1.6, 0.5, { intensity: 3, color: 0xC7001B })
		.addLight(3.5, 1.6, 2.5, { intensity: 3, color: 0xC7001B })
		.addLight(5.5, 1.6, 0.5, { intensity: 3, color: 0xC7001B })
		.addLight(5.5, 1.6, 2.5, { intensity: 3, color: 0xC7001B })
		.addLight(7.5, 1.6, 0.5, { intensity: 3, color: 0xC7001B })
		.addLight(7.5, 1.6, 2.5, { intensity: 3, color: 0xC7001B }),
	new Room("generator", "Generator")
		.setTopology([0, 0], [5, 0], [5, 5], [3, 5], [3, 3], [2, 3], [2, 5], [0, 5])
		.addDoorPoint(0, 1.5, CardinalDirection.East)
		.addDoorPoint(3.5, 0, CardinalDirection.South),
	new Room("closet", "Closet", 3)
		.setTopology([0, 0], [2, 0], [2, 1.5], [0, 1.5])
		.addDoorPoint(0.5, 0, CardinalDirection.South),
	new Room("garage", "Garage", 2)
		.setTopology([0, 0], [6, 0], [6, 4], [0, 4])
		.addDoorPoint(0, 2.5, CardinalDirection.North)
		.addSpawn(2, 1),
	new Room("bathroom", "Bathroom", 2)
		.setTopology([1, 1], [1, 0], [5, 0], [5, 2], [4, 2], [3, 3], [3, 5], [1, 5], [1, 3], [0, 3], [0, 1])
		.addDoorPoint(2.5, 0, CardinalDirection.South)
		.addSpawn(2.5, 1),
	new Room("living_room", "Living room", 2)
		.setTopology([0, 0], [7, 0], [7, 7], [2, 7], [2, 5], [0, 5])
		.addDoorPoint(1.5, 0, CardinalDirection.South)
		.addDoorPoint(7, 4.5, CardinalDirection.West)
		.addSpawn(5, 2),
]);

export const M_MAX_ROOMS = 15;
export const M_LEAF_GENERATION_STEP = 1;
export const M_DOOR_OPEN_PROB = 0.2;
