import { lobbies } from "@/services/lobby";
import {
  M_LEAF_GENERATION_STEP,
  M_MAX_ROOMS,
  ROOMS,
} from "@mansion/shared/constants/map";
import type { Door } from "@mansion/shared/types/map";
import type { Vec2 } from "@mansion/shared/types/util";
import { GameMap, PositionedRoom, Room } from "@mansion/shared/utils/Map";

export default class Generators {
  public static generateLobbyCode(): string {
    const characters = "ABCDEFGHIJKLMNPQRSTVWXYZ0123456789";
    const code = Array.from({ length: 6 }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join("");

    if (lobbies.has(code)) return Generators.generateLobbyCode();
    return code;
  }

  public static generateGuestName(): string {
    return `Guest-${Math.floor(Math.random() * 8999 + 1000)}`;
  }

  public static generateMap(): GameMap {
    const available: Room[] = [];

    ROOMS.forEach((room) => {
      for (let i = 0; i < room.multiplicity; i++) {
        available.push(room.clone());
      }
    });

    const randomRoom = (rooms: Room[]) => {
      const totalWeight = rooms.reduce((sum, room) => sum + room.area, 0);
      let rand = Math.random() * totalWeight;

      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i]!;
        rand -= room.area;
        if (rand <= 0) return room;
      }

      return rooms[rooms.length - 1]!;
    };

    const populate = (
      room: PositionedRoom,
      map: GameMap = new GameMap(),
      depth: number = 0
    ): GameMap => {
      map.rooms.push(room);
      if (map.rooms.length >= M_MAX_ROOMS) return map;

      room.shuffledDoorPoints().forEach((doorPoint) => {
        const foundDoor = map.doorAt(doorPoint.position);

        if (foundDoor) {
          foundDoor.openable = true;
          return;
        }

        let door: Door = {
          position: doorPoint.position,
          direction: doorPoint.direction,
          openable: false,
        };

        map.doors.push(door);
        if (map.rooms.length >= M_MAX_ROOMS) return;

        let positioned: PositionedRoom | null = null;

        let sample = [...available].filter((r) => {
          if (r.deadend && depth < M_LEAF_GENERATION_STEP) return false;
          return r.id !== room.id;
        });

        do {
          const candidate = randomRoom(sample);
          sample = sample.filter((r) => r.id !== candidate.id);
          if (!candidate) continue;

          candidate.shuffledDoorPoints().forEach((candidateDoorPoint) => {
            if (positioned) return;

            let facing =
              (doorPoint.direction - (candidateDoorPoint.direction + 2) + 8) %
              4;

            const [dx, dy] = doorPoint.position;
            const [cdx, cdy] = PositionedRoom.translateFromDirection(
              facing,
              candidateDoorPoint.position
            );

            const pos = [dx - cdx, dy - cdy] as Vec2;
            const positionedCandidate = new PositionedRoom(
              candidate,
              pos,
              facing
            );

            if (map.rooms.every((r) => !r.intersects(positionedCandidate))) {
              positioned = positionedCandidate;
            }
          });
        } while (!positioned && sample.length > 0);

        if (positioned) {
          door.openable = true;

          available.splice(
            available.findIndex((r) => r.id === positioned!.id),
            1
          );

          map = populate(positioned, map, depth + 1);
        }
      });

      return map;
    };

    return populate(
      new PositionedRoom(randomRoom(available.filter((r) => !r.deadend)))
    );
  }
}
