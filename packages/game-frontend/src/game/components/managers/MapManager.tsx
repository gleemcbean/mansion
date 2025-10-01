import React, { useMemo } from "react";
import useLobby from "@/hooks/useLobby";
import Room from "../Room";
import Door from "../Door";
import { GameMap } from "@mansion/shared/utils/Map";

export default function RoomManager() {
  const { metadata } = useLobby();
  const map = useMemo(() => GameMap.fromJSON(metadata!.map), [metadata]);

  return (
    <React.Fragment>
      {map.rooms.map((room, i) => (
        <Room key={i} data={room} />
      ))}
      {map.doors.map((door, i) => (
        <Door key={i} data={door} />
      ))}
    </React.Fragment>
  );
}
