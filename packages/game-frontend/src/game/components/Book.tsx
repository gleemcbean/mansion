import type Anomaly from "@mansion/shared/utils/Anomaly";
import { useAnimations, useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import useLobby from "@/hooks/useLobby";

const BOOK_HALF_WIDTH = 0.64 / 2;
const BOOK_HALF_HEIGHT = 0.48 / 2;
const BOOK_SPEED = 15;
const BOOK_PAGES = ["Left Page", "Right Page"];

const corners = [
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(-BOOK_HALF_WIDTH, BOOK_HALF_HEIGHT, 0),
	new THREE.Vector3(BOOK_HALF_WIDTH, BOOK_HALF_HEIGHT, 0),
	new THREE.Vector3(-BOOK_HALF_WIDTH, -BOOK_HALF_HEIGHT, 0),
	new THREE.Vector3(BOOK_HALF_WIDTH, -BOOK_HALF_HEIGHT, 0),
];

const idleOffsetPosition = new THREE.Vector3(0.4, -0.45, -0.5);
const idleQuaternion = new THREE.Quaternion().setFromEuler(
	new THREE.Euler(Math.PI / 2.6, 0, 0.5),
);

const focusOffsetPosition = new THREE.Vector3(0, -0, -0.3);
const focusOffsetQuaternion = new THREE.Quaternion().setFromEuler(
	new THREE.Euler(Math.PI / 2.05, 0, 0),
);

export default function Book() {
	const { scene, animations } = useGLTF("/models/book.glb");
	const bookRef = useRef<THREE.Group>(null);
	const raycaster = new THREE.Raycaster();
	const currentPosition = new THREE.Vector3();
	const { anomalies } = useLobby();
	const isOpen = useRef(false);
	const interactingRef = useRef(false);
	const { 1: get } = useKeyboardControls();
	const targetPositions = useRef([idleOffsetPosition, idleQuaternion]);

	const { actions, mixer } = useAnimations(animations, scene);

	const pages = useRef<[Anomaly, Anomaly]>(
		anomalies.slice(0, 2) as [Anomaly, Anomaly],
	);

	useFrame(({ camera, scene }, deltaTime) => {
		if (!bookRef.current) return;

		const keys = get();
		let interacting = false;
		interacting = !interactingRef.current && keys.book;
		interactingRef.current = keys.book;

		if (interacting) {
			isOpen.current = !isOpen.current;

			targetPositions.current = isOpen.current
				? [focusOffsetPosition, focusOffsetQuaternion]
				: [idleOffsetPosition, idleQuaternion];

			const action = actions.NlaTrack1;

			if (action) {
				action.timeScale = [-1, +1][+isOpen.current] * deltaTime * 300;
				action.paused = false;
				action.loop = THREE.LoopOnce;
				action.clampWhenFinished = true;
				action.play();
			}
		}

		const [offsetPosition, offsetQuaternion] = targetPositions.current as [
			THREE.Vector3,
			THREE.Quaternion,
		];

		const targetPosition = offsetPosition
			.clone()
			.applyQuaternion(camera.quaternion)
			.add(camera.position);

		const direction = targetPosition.clone().sub(camera.position).normalize();
		const distance = offsetPosition.length();

		const objects = scene.children.filter((obj) => obj !== bookRef.current);
		let closestHit = distance;

		for (const corner of corners) {
			const worldCorner = corner.clone().applyQuaternion(camera.quaternion);
			const rayOrigin = camera.position.clone().add(worldCorner);

			raycaster.set(rayOrigin, direction);
			const intersects = raycaster.intersectObjects(objects, true);

			if (intersects.length > 0 && intersects[0].distance < closestHit) {
				closestHit = intersects[0].distance;
			}
		}

		if (closestHit < distance) {
			const safePosition = camera.position
				.clone()
				.add(direction.multiplyScalar(closestHit - 0.05));
			currentPosition.lerp(safePosition, deltaTime * BOOK_SPEED);
		} else {
			currentPosition.lerp(targetPosition, deltaTime * BOOK_SPEED);
		}

		bookRef.current.position.copy(currentPosition);
		bookRef.current.quaternion
			.copy(camera.quaternion)
			.multiply(offsetQuaternion);
	});

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

	const replaceTexture = (
		material: THREE.MeshStandardMaterial,
		textureUrl: string,
	) => {
		const loader = new THREE.TextureLoader();

		loader.load(textureUrl, (texture) => {
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.flipY = false;
			material.map = texture;
			material.needsUpdate = true;
		});
	};

	useEffect(() => {
		scene.traverse((obj) => {
			// if (obj.isBone) console.log(obj);
		});

		scene.getObjectByName("Plane_1")!.visible = false;
		scene.getObjectByName("Plane_2")!.visible = false;

		pages.current.forEach((anomaly, index) => {
			const pageHash = btoa(
				JSON.stringify({
					step: 0,
					anomaly: anomaly.id,
					syllables: anomaly.syllables,
				}),
			);

			replaceTexture(
				getMaterialByName(scene, BOOK_PAGES[index])!,
				`http://localhost:8080/book-page?d=${pageHash}`,
			);
		});
	}, []);

	return (
		<group ref={bookRef}>
			<primitive object={scene} />
		</group>
	);
}
