import type { Door as DoorType } from "@mansion/shared/types/map";
import { CardinalDirection } from "@mansion/shared/types/util";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
	CuboidCollider,
	type RapierCollider,
	type RapierRigidBody,
	RigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

type DoorProps = {
	data: DoorType;
};

export default function Door({ data }: DoorProps) {
	const doorGroupRef = useRef<THREE.Group>(null);
	const rigidBodyRef = useRef<RapierRigidBody>(null);
	const colliderRef = useRef<RapierCollider>(null);
	const isOpen = useRef(data.opened);

	const openingDirectionMultiplicatorRef = useRef(
		[-1, +1][Math.floor(Math.random() * 2)],
	);

	const targetRotation = useRef(0);

	const { scene } = useGLTF(
		data.openable ? "/models/door.glb" : "/models/locked_door.glb",
	);

	const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

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

	useFrame((_, delta) => {
		const door = doorGroupRef.current?.children[1];
		if (!door) return;

		const target = targetRotation.current;
		const diff = Math.abs(door.rotation.y - target);

		if (diff < 0.001) {
			door.rotation.y = target;
			return;
		}

		door.rotation.y = THREE.MathUtils.lerp(door.rotation.y, target, 5 * delta);
	});

	useEffect(() => {
		if (!doorGroupRef.current) return;

		const group = doorGroupRef.current;
		const door = doorGroupRef.current.children[1];

		door.rotation.y = targetRotation.current = isOpen.current
			? (Math.PI / 1.4) * openingDirectionMultiplicatorRef.current
			: 0;

		colliderRef.current?.setEnabled(!isOpen.current);

		console.log(door.rotation.y);

		group.userData.title = isOpen.current ? "Close Door" : "Open Door";
		group.userData.execute = data.openable
			? () => {
					const door = group.children[1];
					if (!door) return;
					isOpen.current = !isOpen.current;
					targetRotation.current = isOpen.current
						? (Math.PI / 1.4) * openingDirectionMultiplicatorRef.current
						: 0;
					colliderRef.current?.setEnabled(!isOpen.current);
				}
			: null;
	}, [doorGroupRef, data.openable]);

	return (
		<RigidBody
			ref={rigidBodyRef}
			type="fixed"
			rotation={[0, rotationY, 0]}
			position={[data.position[0], 0, data.position[1]]}
			colliders={false}
			friction={0}
		>
			<CuboidCollider ref={colliderRef} args={[0.1, 1, 0.4]} />
			<primitive object={clonedScene} ref={doorGroupRef} />
		</RigidBody>
	);
}
