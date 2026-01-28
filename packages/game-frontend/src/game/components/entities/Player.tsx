import {
	PL_CROUCH_HEIGHT,
	PL_CROUCH_THICKNESS,
	PL_HEIGHT,
	PL_PROXIMITY_CHAT_DISTANCE,
	PL_THICKNESS,
} from "@mansion/shared/constants/player";
import type { Client } from "@mansion/shared/types/player";
import type { Quat, Vec3 } from "@mansion/shared/types/util";
import { Text, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
	CapsuleCollider,
	type RapierRigidBody,
	RigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import useClient from "@/hooks/useClient";

type PlayerProps = Required<Client>;

const normalizeAngle = (a: number) => {
	return THREE.MathUtils.euclideanModulo(a + Math.PI, Math.PI * 2) - Math.PI;
};

const angleLerp = (from: number, to: number, t: number) => {
	return from + normalizeAngle(to - from) * t;
};

export default function Player({ playerData, username }: PlayerProps) {
	const { options } = useClient();
	const { scene } = useGLTF("/models/player.glb");

	const gameData = useMemo(() => playerData!.gameData!, [playerData]);
	const character = useMemo(() => SkeletonUtils.clone(scene), [scene]);
	const bodyYaw = useRef(0);

	const [height, setHeight] = useState(PL_HEIGHT);
	const [thickness, setThickness] = useState(PL_THICKNESS);

	const velocityRef = useRef(new THREE.Vector3());
	const targetPosition = useRef(new THREE.Vector3(...gameData.position));
	const currentPosition = useRef(new THREE.Vector3(...gameData.position));
	const targetScale = useRef(new THREE.Vector3(1, 1, 1));
	const targetHeight = useRef(PL_HEIGHT);
	const targetThickness = useRef(PL_THICKNESS);

	const targetQuaternion = useRef(new THREE.Quaternion(...gameData.quaternion));
	const currentQuaternion = useRef(
		new THREE.Quaternion(...gameData.quaternion),
	);

	const bodyRef = useRef<RapierRigidBody>(null);
	const nameTagRef = useRef<THREE.Object3D>(null);
	const capLightRef = useRef<THREE.PointLight>(null);

	const getMaterialByName = (
		scene: THREE.Object3D,
		name: string,
	): THREE.MeshStandardMaterial | null => {
		let found: THREE.MeshStandardMaterial | null = null;

		scene.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				const mat = (
					(child as THREE.Mesh).material as THREE.MeshStandardMaterial
				).clone();

				(child as THREE.Mesh).material = mat;
				if (mat.name === name) found = mat;
			}
		});

		return found;
	};

	useEffect(() => {
		targetPosition.current.set(...(gameData.position as Vec3));
		targetQuaternion.current.set(...(gameData.quaternion as Quat));
	}, [gameData.position, gameData.quaternion]);

	useEffect(() => {
		if (playerData.gameData?.crouched) {
			targetScale.current.set(0.4, 0.4, 0.4);
			targetHeight.current = PL_CROUCH_HEIGHT;
			targetThickness.current = PL_CROUCH_THICKNESS;
		} else {
			targetScale.current.set(1, 1, 1);
			targetHeight.current = PL_HEIGHT;
			targetThickness.current = PL_THICKNESS;
		}
	}, [playerData.gameData?.crouched]);

	useEffect(() => {
		const cap = getMaterialByName(character, "Cap")!;
		cap.color.set(playerData.mushroomCapColor);

		const armL = character.getObjectByName("UpperArmL")!;
		const armR = character.getObjectByName("UpperArmR")!;

		armL.rotation.y = (-Math.PI / 16) * 5;
		armR.rotation.y = (Math.PI / 16) * 5;
	}, [playerData.mushroomCapColor]);

	useFrame(({ camera, clock }, delta) => {
		currentPosition.current.lerp(targetPosition.current, 0.1);
		currentQuaternion.current.slerp(targetQuaternion.current, 0.1);

		character.scale.x +=
			(targetScale.current.x - character.scale.x) * delta * 10;
		character.scale.y +=
			(targetScale.current.y - character.scale.y) * delta * 10;
		character.scale.z +=
			(targetScale.current.z - character.scale.z) * delta * 10;

		setHeight((prev) => prev + (targetHeight.current - prev) * delta * 10);
		setThickness(
			(prev) => prev + (targetThickness.current - prev) * delta * 10,
		);

		velocityRef.current
			.copy(targetPosition.current)
			.sub(currentPosition.current);

		bodyRef.current?.setNextKinematicTranslation(currentPosition.current);
		nameTagRef.current?.quaternion.copy(camera.quaternion.clone());

		currentQuaternion.current.slerp(
			targetQuaternion.current,
			1 - Math.exp(-12 * delta),
		);

		const targetEuler = new THREE.Euler().setFromQuaternion(
			currentQuaternion.current,
			"YXZ",
		);

		const maxHeadTurn = THREE.MathUtils.degToRad(30);
		const headYawRelative = normalizeAngle(targetEuler.y - bodyYaw.current);

		let targetBodyYaw = bodyYaw.current;

		if (headYawRelative > maxHeadTurn) {
			targetBodyYaw = targetEuler.y - maxHeadTurn;
		}

		if (headYawRelative < -maxHeadTurn) {
			targetBodyYaw = targetEuler.y + maxHeadTurn;
		}

		const bodyT = 1 - Math.exp(-8 * delta);
		bodyYaw.current = angleLerp(bodyYaw.current, targetBodyYaw, bodyT);

		const clampedHeadYaw = THREE.MathUtils.clamp(
			normalizeAngle(targetEuler.y - bodyYaw.current),
			-maxHeadTurn,
			maxHeadTurn,
		);

		character.rotation.y = bodyYaw.current;

		const head = character.getObjectByName("Head")!;
		head.rotation.order = "YXZ";
		head.rotation.y = clampedHeadYaw;
		head.rotation.x = -targetEuler.x;
		head.rotation.z = -targetEuler.z;

		if (capLightRef.current) {
			const mushroom = character.getObjectByName("Mushroom")!;
			const mushroomWorldPos = new THREE.Vector3();
			mushroom.getWorldPosition(mushroomWorldPos);
			const mushroomPos = character.worldToLocal(mushroomWorldPos.clone());
			capLightRef.current.position.copy(mushroomPos);
		}

		const speed = velocityRef.current.length();
		const legL = character.getObjectByName("LegL")!;
		const legR = character.getObjectByName("LegR")!;
		const armL = character.getObjectByName("UpperArmL")!;
		const armR = character.getObjectByName("UpperArmR")!;
		const sprinkles = getMaterialByName(character, "Sprinkles")!;
		sprinkles.emissive = new THREE.Color(0xe479ed);
		sprinkles.emissiveIntensity = playerData.gameData?.lighting ? 5 : 0;

		if (speed > 0.01) {
			const t = clock.elapsedTime * 20;
			legL.rotation.x = (Math.PI / 4) * (4 + Math.cos(t));
			legR.rotation.x = (Math.PI / 4) * (4 + Math.sin(t));
			armL.rotation.z = (Math.PI / 4.5) * (6 + Math.sin(t));
			armR.rotation.z = (-Math.PI / 4.5) * (6 + Math.cos(t));
		} else {
			legL.rotation.x = Math.PI;
			legR.rotation.x = Math.PI;
			armL.rotation.z = -Math.PI / 2;
			armR.rotation.z = Math.PI / 2;
		}
	});

	return (
		<RigidBody type="kinematicPosition" colliders={false} ref={bodyRef}>
			{options.hud && !playerData.gameData?.crouched && (
				<Text
					position={[0, height / 2 + thickness + 0.2, 0]}
					fontSize={0.12}
					fontWeight={800}
					color="white"
					anchorX="center"
					anchorY="middle"
					ref={nameTagRef}
				>
					{username}
				</Text>
			)}
			<group
				position={[0, -height / 2 - PL_THICKNESS, 0]}
				rotation={[0, Math.PI, 0]}
			>
				<primitive object={character} />
			</group>
			<CapsuleCollider args={[height / 2, thickness]} friction={0} />
			{options.showHelper && (
				<mesh>
					<sphereGeometry args={[PL_PROXIMITY_CHAT_DISTANCE, 8, 8]} />
					<meshBasicMaterial color="green" wireframe />
				</mesh>
			)}
		</RigidBody>
	);
}
