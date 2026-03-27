import { GameMap } from "@mansion/shared/utils/Map";
import { RigidBody } from "@react-three/rapier";
import React, { useMemo } from "react";
import useLobby from "@/hooks/useLobby";
import Door from "../Door";
import Room from "../Room";

export default function RoomManager() {
	const { metadata } = useLobby();
	const map = useMemo(() => GameMap.fromJSON(metadata!.map), [metadata]);

	return (
		<React.Fragment>
			<RigidBody type="fixed">
				<mesh position={[0, -2.51, 0]}>
					<boxGeometry args={[100, 5, 100]} />
					<meshBasicMaterial color="white" transparent />
				</mesh>
			</RigidBody>
			{map.rooms.map((room) => (
				<Room key={room.uuid} data={room} />
			))}
			{map.doors.map((door) => (
				<Door key={door.uuid} data={door} />
			))}
		</React.Fragment>
	);
}
