import {
	PL_CROUCH_FOV,
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
import {
	KeyboardControls as DREIKeyboardControls,
	useKeyboardControls,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
	CapsuleCollider,
	type RapierRigidBody,
	RigidBody,
} from "@react-three/rapier";
import React, { useCallback, useEffect, useRef } from "react";
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
const LIGHT_UPDATE_THRESHOLD = 0.01;

const _direction = new THREE.Vector3();
const _frontVector = new THREE.Vector3();
const _sideVector = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, "YXZ");
const _origin = new THREE.Vector3();
const _lightDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _down = new THREE.Vector3(0, -1, 0);

function lightenDarkenColor(col: string, amt: number) {
	var usePound = false;
	if (col[0] === "#") {
		col = col.slice(1);
		usePound = true;
	}

	var num = parseInt(col, 16);

	var r = (num >> 16) + amt;

	if (r > 255) r = 255;
	else if (r < 0) r = 0;

	var b = ((num >> 8) & 0x00ff) + amt;

	if (b > 255) b = 255;
	else if (b < 0) b = 0;

	var g = (num & 0x0000ff) + amt;

	if (g > 255) g = 255;
	else if (g < 0) g = 0;

	return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

function KeyboardControlsLogic({ spawn }: KeyboardControlsProps) {
	const body = useRef<RapierRigidBody>(null);
	const colliderRef = useRef<any>(null);
	const spotLightRef = useRef<THREE.SpotLight>(null);
	const lightTargetRef = useRef<THREE.Object3D>(null);

	const lightingValue = useRef(false);
	const lightingReady = useRef(true);

	const heightRef = useRef(PL_HEIGHT);
	const thicknessRef = useRef(PL_THICKNESS);
	const targetHeightRef = useRef(PL_HEIGHT);
	const targetThicknessRef = useRef(PL_THICKNESS);

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

	const sceneObjectsRef = useRef<THREE.Object3D[]>([]);

	const { 1: get } = useKeyboardControls();
	const { client, options, room, bookOpen, setRoom, setGameData } = useClient();
	const { map } = useLobby();
	const { send } = useWebsocket();
	const { scene } = useThree();

	useEffect(() => {
		const rebuild = () => {
			const list: THREE.Object3D[] = [];
			scene.traverse((obj) => list.push(obj));
			sceneObjectsRef.current = list;
		};

		rebuild();
		scene.addEventListener("childadded", rebuild);
		scene.addEventListener("childremoved", rebuild);

		return () => {
			scene.removeEventListener("childadded", rebuild);
			scene.removeEventListener("childremoved", rebuild);
		};
	}, [scene]);

	useEffect(() => {
		body.current?.setTranslation(
			{
				x: spawn[0],
				y: targetHeightRef.current / 2 + PL_THICKNESS + 0.1,
				z: spawn[1],
			},
			false,
		);
	}, []);

	const syncRaycasterRanges = useCallback(() => {
		jRaycaster.current.far =
			targetHeightRef.current / 2 + PL_THICKNESS + PL_EYE_DISTANCE + 0.05;
		cRaycaster.current.far =
			targetHeightRef.current / 2 + PL_THICKNESS - PL_EYE_DISTANCE + 0.25;
		jRaycaster.current.near = 0;
		cRaycaster.current.near = 0;
		jRaycaster.current.params.Mesh = { side: THREE.FrontSide };
		cRaycaster.current.params.Mesh = { side: THREE.FrontSide };
	}, []);

	useEffect(() => {
		syncRaycasterRanges();
	}, []);

	const raycastScene = useCallback(
		(origin: THREE.Vector3, dir: THREE.Vector3, raycaster: THREE.Raycaster) => {
			raycaster.set(origin, dir);
			return raycaster.intersectObjects(sceneObjectsRef.current, true);
		},
		[],
	);

	useFrame(({ camera }, delta) => {
		if (!body.current) return;

		const sendPosPacket = (data: PlayerGameData) => {
			const now = performance.now();
			if (now - lastSent.current < 50) return;
			lastSent.current = now;
			send(ClientPacketType.PlayerUpdate, { gameData: data });
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

		const crouched = heightRef.current + 0.2 < PL_HEIGHT;
		const sprinting = sprint && energy.current > 1 && !crouched;
		const canLight = lightingValue.current && energy.current > 0;

		const oldEnergy = energy.current;

		if (!options.godMode) {
			if (sprinting) energy.current -= delta * 10;
			if (lightingValue.current) energy.current -= delta * 6;
		}
		energy.current = Math.max(0, energy.current);

		if (energy.current !== oldEnergy) {
			lastEnergyDrain.current = Date.now();
		} else if (lastEnergyDrain.current + 1000 < Date.now()) {
			energy.current = Math.min(PL_MAX_STAMINA, energy.current + delta * 6);
		}

		if (
			(lightPressed && lightingReady.current) ||
			(lightingValue.current && !canLight)
		) {
			lightingValue.current = !lightingValue.current;
			lightingReady.current = false;
			if (spotLightRef.current) {
				spotLightRef.current.visible = lightingValue.current;
			}
		}
		if (!lightPressed && !lightingReady.current) {
			lightingReady.current = true;
		}

		camera.getWorldPosition(_origin);

		const ceilHits = raycastScene(_origin, _up, cRaycaster.current);
		const canDecrouch = !ceilHits[0];

		if (crouch) {
			wasCrouching.current = true;
		} else if (canDecrouch) {
			wasCrouching.current = false;
		}

		const prevTarget = targetHeightRef.current;

		if (wasCrouching.current) {
			targetHeightRef.current = PL_CROUCH_HEIGHT;
			targetThicknessRef.current = PL_CROUCH_THICKNESS;
		} else {
			targetHeightRef.current = PL_HEIGHT;
			targetThicknessRef.current = PL_THICKNESS;
		}

		heightRef.current +=
			(targetHeightRef.current - heightRef.current) * delta * 5;
		thicknessRef.current +=
			(targetThicknessRef.current - thicknessRef.current) * delta * 5;

		if (prevTarget !== targetHeightRef.current) {
			syncRaycasterRanges();
		}

		if (colliderRef.current) {
			colliderRef.current.setHalfHeight?.(heightRef.current / 2);
			colliderRef.current.setRadius?.(thicknessRef.current);
		}

		if (spotLightRef.current && lightingValue.current) {
			const ratio = heightRef.current / PL_HEIGHT;
			const nextIntensity = 20 - ratio * 15;
			const nextDistance = 20 - ratio * 13;
			const nextAngle = ratio * 1.05;

			if (
				Math.abs(spotLightRef.current.intensity - nextIntensity) >
				LIGHT_UPDATE_THRESHOLD
			) {
				spotLightRef.current.intensity = nextIntensity;
			}
			if (
				Math.abs(spotLightRef.current.distance - nextDistance) >
				LIGHT_UPDATE_THRESHOLD
			) {
				spotLightRef.current.distance = nextDistance;
			}
			if (
				Math.abs(spotLightRef.current.angle - nextAngle) >
				LIGHT_UPDATE_THRESHOLD
			) {
				spotLightRef.current.angle = nextAngle;
			}
		}

		const { y: yVel } = body.current.linvel() ?? { y: 0 };

		_frontVector.set(0, 0, backward - forward);
		_sideVector.set(left - right, 0, 0);
		_direction.subVectors(_frontVector, _sideVector);

		if (options.fly) _direction.y = Number(keys.jump) - Number(keys.crouch);

		_direction.normalize();
		_euler.set(0, camera.rotation.y, 0);
		_direction.applyEuler(_euler);

		const speed =
			PL_SPEED *
			options.speed *
			(sprinting ? PL_SPRINT_SPEED_MULTIPLIER : 1) *
			(crouched ? PL_CROUCH_SPEED_MULTIPLIER : 1) *
			(options.fly ? PL_FLY_SPEED_MULTIPLIER : 1);

		_direction.multiplyScalar(speed);
		body.current.setGravityScale(options.fly ? 0 : 1, false);

		if (_direction.lengthSq() > 0) {
			body.current.wakeUp?.();
			targetFovRef.current = sprinting
				? PL_SPRINT_FOV
				: crouched
					? PL_CROUCH_FOV
					: PL_FOV;

			body.current.setLinvel(
				{
					x: _direction.x,
					y: options.fly ? _direction.y : yVel,
					z: _direction.z,
				},
				true,
			);
		} else {
			if (!sprinting) targetFovRef.current = crouched ? PL_CROUCH_FOV : PL_FOV;
			body.current.setLinvel(
				{
					x: _direction.x * 0.9,
					y: options.fly ? _direction.y * 0.9 : yVel,
					z: _direction.z * 0.9,
				},
				true,
			);
		}

		const floorHits = raycastScene(_origin, _down, jRaycaster.current);
		const grounded = !!floorHits[0];

		if (jump && !crouched && grounded && yVel < 0.25) {
			const vol = Math.PI * thicknessRef.current ** 2 * heightRef.current;
			const ratio = vol / PL_VOLUME;
			body.current.applyImpulse(
				{ x: _direction.x, y: PL_JUMP_FORCE * ratio, z: _direction.z },
				true,
			);
		}

		const t = body.current.translation();
		const q = camera.quaternion.clone();
		camera.position.set(t.x, t.y + PL_EYE_DISTANCE, t.z);

		if (lightTargetRef.current) {
			camera.getWorldDirection(_lightDir);
			lightTargetRef.current.position
				.set(t.x, t.y + PL_EYE_DISTANCE, t.z)
				.addScaledVector(_lightDir, 10);
		}

		if (
			!oldQuat.current.equals(q) ||
			!oldPos.current.equals(t) ||
			!lightingReady.current ||
			oldEnergy !== energy.current
		) {
			const oldGameData = client.playerData?.gameData;

			const newGameData: PlayerGameData = {
				position: [t.x, t.y, t.z],
				quaternion: q,
				crouched,
				running: sprint,
				health: 100,
				energy: energy.current,
				lighting: lightingValue.current,
				anomalySteps: oldGameData?.anomalySteps ?? {},
				captured: oldGameData?.captured ?? [],
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

		map!.rooms.forEach((r) => {
			if (room === r.name || !r.t_pointIn([t.x, t.z])) return;
			setRoom(r.name);
		});
	});

	return (
		<React.Fragment>
			<object3D ref={lightTargetRef} />
			<RigidBody
				ref={body}
				colliders={false}
				mass={50}
				lockRotations={true}
				linearDamping={0.5}
				angularDamping={1}
				friction={0}
			>
				{!options.noClip && (
					<CapsuleCollider
						ref={colliderRef}
						args={[PL_HEIGHT / 2, PL_THICKNESS]}
					/>
				)}
				<spotLight
					ref={spotLightRef}
					position={[0, PL_EYE_DISTANCE, 0]}
					intensity={20}
					distance={20}
					decay={0.2}
					angle={1.2}
					penumbra={0.5}
					castShadow={false}
					color={lightenDarkenColor(client.playerData!.mushroomCapColor, 130)}
					visible={false}
					target={lightTargetRef.current ?? undefined}
				/>
			</RigidBody>
		</React.Fragment>
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
