import {
	PL_CROUCH_HEIGHT,
	PL_CROUCH_SPEED_MULTIPLIER,
	PL_CROUCH_THICKNESS,
	PL_EYE_DISTANCE,
	PL_FLY_SPEED_MULTIPLIER,
	PL_FOV,
	PL_HEIGHT,
	PL_JUMP_FORCE,
	PL_MAX_STAMINA,
	PL_SPEED,
	PL_SPRINT_FOV,
	PL_SPRINT_SPEED_MULTIPLIER,
	PL_THICKNESS,
} from "@mansion/shared/constants/player";
import { ClientPacketType } from "@mansion/shared/types/packets";
import type { PlayerGameData } from "@mansion/shared/types/player";
import type { Vec2 } from "@mansion/shared/types/util";
import { GameMap } from "@mansion/shared/utils/Map";
import {
	KeyboardControls as DREIKeyboardControls,
	useKeyboardControls,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
	CapsuleCollider,
	type RapierRigidBody,
	RigidBody,
} from "@react-three/rapier";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import usePlayer from "@/hooks/useClient";
import useClient from "@/hooks/useClient";
import useLobby from "@/hooks/useLobby";
import useWebsocket from "@/hooks/useWebsocket";
import Book from "../Book";
import Selector from "./Selector";

type KeyboardControlsProps = {
	spawn: Vec2;
};

const PL_VOLUME = Math.PI * PL_THICKNESS ** 2 * PL_HEIGHT;

function KeyboardControlsLogic({ spawn }: KeyboardControlsProps) {
	const body = useRef<RapierRigidBody>(null);
	const [lighting, setLighting] = useState({ value: false, ready: true });
	const [height, setHeight] = useState(PL_HEIGHT);
	const [thickness, setThickness] = useState(PL_THICKNESS);
	const targetHeight = useRef(PL_HEIGHT);
	const targetThickness = useRef(PL_THICKNESS);

	const lastSent = useRef(0);
	const lastEnergyDrain = useRef(0);
	const energy = useRef(100);
	const wasCrouching = useRef(false);
	const fovRef = useRef(PL_FOV);
	const targetFovRef = useRef(PL_FOV);
	const oldQuat = useRef(new THREE.Quaternion());
	const oldPos = useRef(new THREE.Vector3());
	const jRaycaster = useRef(new THREE.Raycaster());
	const cRaycaster = useRef(new THREE.Raycaster());

	const { 1: get } = useKeyboardControls();
	const { options, room, bookOpen, setRoom, setGameData } = useClient();
	const { metadata } = useLobby();
	const { send } = useWebsocket();

	const map = useMemo(() => GameMap.fromJSON(metadata!.map), [metadata]);

	const direction = new THREE.Vector3();
	const frontVector = new THREE.Vector3();
	const sideVector = new THREE.Vector3();
	const euler = new THREE.Euler(0, 0, 0, "YXZ");

	useEffect(() => {
		body.current?.setTranslation(
			{
				x: spawn[0],
				y: targetHeight.current / 2 + PL_THICKNESS + 0.1,
				z: spawn[1],
			},
			false,
		);
	}, []);

	useEffect(() => {
		jRaycaster.current.far =
			targetHeight.current / 2 + PL_THICKNESS + PL_EYE_DISTANCE + 0.05;
		cRaycaster.current.far =
			targetHeight.current / 2 + PL_THICKNESS - PL_EYE_DISTANCE + 0.25;

		jRaycaster.current.near = cRaycaster.current.near = 0;

		jRaycaster.current.params.Mesh = cRaycaster.current.params.Mesh = {
			side: THREE.FrontSide,
		};
	}, [targetHeight.current]);

	useFrame(({ scene, camera }, delta) => {
		if (!body.current) return;

		const sendPosPacket = (data: PlayerGameData) => {
			const now = performance.now();
			if (now - lastSent.current < 50) return;
			lastSent.current = now;
			send(ClientPacketType.PlayerUpdate, { gameData: data });
		};

		const raycastScene = (
			origin: THREE.Vector3,
			dir: THREE.Vector3,
			raycaster: THREE.Raycaster,
		) => {
			const candidates: THREE.Object3D[] = [];
			scene.traverse((obj) => candidates.push(obj));
			raycaster.set(origin, dir);
			return raycaster.intersectObjects(candidates, true);
		};

		const keys = get();
		const forward = Number(keys.forward && !bookOpen);
		const backward = Number(keys.backward && !bookOpen);
		const left = Number(keys.left && !bookOpen);
		const right = Number(keys.right && !bookOpen);
		const sprint = keys.sprint;
		const jump = keys.jump && !bookOpen;
		const crouch = keys.crouch && !options.fly;
		const lightPressed = keys.light;

		const crouched = height + 0.2 < PL_HEIGHT;
		const sprinting = sprint && energy.current > 1 && !crouched;
		const canLight =
			lighting.value && energy.current > 0 && height > PL_CROUCH_HEIGHT + 0.2;

		const oldEnergy = energy.current;

		if (!options.godMode) {
			if (sprinting) energy.current -= delta * 10;
			if (lighting.value) energy.current -= delta * 6;
		}
		energy.current = Math.max(0, energy.current);

		if (energy.current !== oldEnergy) {
			lastEnergyDrain.current = Date.now();
		} else if (lastEnergyDrain.current + 1000 < Date.now()) {
			energy.current = Math.min(PL_MAX_STAMINA, energy.current + delta * 6);
		}

		if ((lightPressed && lighting.ready) || (lighting.value && !canLight)) {
			setLighting((prev) => ({ value: !prev.value, ready: false }));
		}
		if (!lightPressed && !lighting.ready) {
			setLighting((prev) => ({ ...prev, ready: true }));
		}

		const origin = camera.getWorldPosition(new THREE.Vector3());
		const ceilHits = raycastScene(
			origin,
			new THREE.Vector3(0, 1, 0),
			cRaycaster.current,
		);
		const canDecrouch = !ceilHits[0];

		if (crouch) {
			wasCrouching.current = true;
		} else if (canDecrouch) {
			wasCrouching.current = false;
		}

		if (wasCrouching.current) {
			targetHeight.current = PL_CROUCH_HEIGHT;
			targetThickness.current = PL_CROUCH_THICKNESS;
		} else {
			targetHeight.current = PL_HEIGHT;
			targetThickness.current = PL_THICKNESS;
		}

		setHeight((prev) => prev + (targetHeight.current - prev) * delta * 5);
		setThickness((prev) => prev + (targetThickness.current - prev) * delta * 5);

		const { y: yVel } = body.current.linvel() ?? { y: 0 };

		frontVector.set(0, 0, backward - forward);
		sideVector.set(left - right, 0, 0);
		direction.subVectors(frontVector, sideVector);

		if (options.fly) direction.y = Number(keys.jump) - Number(keys.crouch);

		direction.normalize();
		euler.set(0, camera.rotation.y, 0);
		direction.applyEuler(euler);

		const speed =
			PL_SPEED *
			options.speed *
			(sprinting ? PL_SPRINT_SPEED_MULTIPLIER : 1) *
			(crouched ? PL_CROUCH_SPEED_MULTIPLIER : 1) *
			(options.fly ? PL_FLY_SPEED_MULTIPLIER : 1);

		direction.multiplyScalar(speed);
		body.current.setGravityScale(options.fly ? 0 : 1, false);

		if (direction.lengthSq() > 0) {
			body.current.wakeUp?.();
			targetFovRef.current = sprinting ? PL_SPRINT_FOV : PL_FOV;
			body.current.setLinvel(
				{ x: direction.x, y: options.fly ? direction.y : yVel, z: direction.z },
				true,
			);
		} else {
			if (!sprinting) targetFovRef.current = PL_FOV;
			body.current.setLinvel(
				{
					x: direction.x * 0.9,
					y: options.fly ? direction.y * 0.9 : yVel,
					z: direction.z * 0.9,
				},
				true,
			);
		}

		const floorHits = raycastScene(
			origin,
			new THREE.Vector3(0, -1, 0),
			jRaycaster.current,
		);
		const grounded = !!floorHits[0];

		if (jump && !crouched && grounded && yVel < 0.25) {
			const vol = Math.PI * thickness ** 2 * height;
			const ratio = vol / PL_VOLUME;
			body.current.applyImpulse(
				{ x: direction.x, y: PL_JUMP_FORCE * ratio, z: direction.z },
				true,
			);
		}

		const t = body.current.translation();
		const q = camera.quaternion.clone();
		camera.position.set(t.x, t.y + PL_EYE_DISTANCE, t.z);

		if (
			!oldQuat.current.equals(q) ||
			!oldPos.current.equals(t) ||
			!lighting.ready ||
			oldEnergy !== energy.current
		) {
			const newGameData: PlayerGameData = {
				position: [t.x, t.y, t.z],
				quaternion: q,
				crouched,
				running: sprint,
				health: 100,
				energy: energy.current,
				lighting: lighting.value,
			};
			setGameData(newGameData);
			sendPosPacket(newGameData);
		}

		oldQuat.current.copy(q);
		oldPos.current.copy(t);

		if ("fov" in camera) {
			fovRef.current += (targetFovRef.current - fovRef.current) * delta * 10;
			camera.fov = fovRef.current;
			camera.updateProjectionMatrix();
		}

		map.rooms.forEach((r) => {
			if (room === r.name || !r.pointIn([t.x, t.z])) return;
			setRoom(r.name);
		});
	});

	return (
		<RigidBody
			ref={body}
			colliders={false}
			mass={50}
			lockRotations={true}
			linearDamping={0.5}
			angularDamping={1}
			friction={0}
		>
			{!options.noClip && <CapsuleCollider args={[height / 2, thickness]} />}
			<pointLight
				position={[0, height / 2, 0]}
				intensity={6}
				distance={8}
				decay={0.4}
				color={0xe8a7f0}
				visible={lighting.value}
			/>
		</RigidBody>
	);
}

export default function KeyboardControls({ spawn }: KeyboardControlsProps) {
	const { options } = usePlayer();

	const keyify = useCallback(
		(key: (string | null)[]) => {
			return key.filter((o) => o) as [string, string];
		},
		[options],
	);

	return (
		<DREIKeyboardControls
			map={[
				{ name: "forward", keys: keyify(options.forward) },
				{ name: "backward", keys: keyify(options.backward) },
				{ name: "left", keys: keyify(options.left) },
				{ name: "right", keys: keyify(options.right) },
				{ name: "jump", keys: keyify(options.up) },
				{ name: "sprint", keys: keyify(options.sprint) },
				{ name: "crouch", keys: keyify(options.crouch) },
				{ name: "interact", keys: keyify(options.interact) },
				{ name: "book", keys: keyify(options.book) },
				{ name: "light", keys: keyify(options.light) },
			]}
		>
			<KeyboardControlsLogic spawn={spawn} />
			<Selector />
			<Book />
		</DREIKeyboardControls>
	);
}
