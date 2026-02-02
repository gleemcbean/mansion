import type { Door as DoorType } from "@mansion/shared/types/map";
import { CardinalDirection } from "@mansion/shared/types/util";
import { Gltf } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";

type DoorProps = {
	data: DoorType;
};

export default function Door({ data }: DoorProps) {
	const doorGroupRef = useRef<THREE.Group>(null);

	const rotationY = useMemo(() => {
		switch (data.direction) {
			case CardinalDirection.East:
			case CardinalDirection.West:
				return (data.direction - 1) * (Math.PI / 2);

			case CardinalDirection.North:
			case CardinalDirection.South:
				return (data.direction + 1) * (Math.PI / 2);
		}
	}, [data.direction]);

	useEffect(() => {
		if (!doorGroupRef.current) return;
		const door = doorGroupRef.current.children[1];
		if (!door) return;

		if (data.openable) {
			door.rotation.y = Math.PI / 1.2;
		}
	}, [doorGroupRef.current]);

	return (
		<RigidBody
			type="fixed"
			rotation={[0, rotationY, 0]}
			position={[data.position[0], 0, data.position[1]]}
			colliders={data.openable ? false : "cuboid"}
			friction={0}
		>
			<Gltf
				src={data.openable ? "/models/door.glb" : "/models/locked_door.glb"}
				ref={doorGroupRef}
			/>
		</RigidBody>
	);
}
