import type { CardinalDirection, Vec2 } from "./util";

export type DoorPoint = {
  position: Vec2;
  direction: CardinalDirection;
};

export type Door = {
  position: Vec2;
  direction: CardinalDirection;
  openable: boolean;
};
