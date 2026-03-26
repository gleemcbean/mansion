import { useAnimations, useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import useClient from "@/hooks/useClient";
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
	const { setBookOpen } = useClient();
	const isOpen = useRef(false);
	const interactingRef = useRef(false);
	const leftPageRef = useRef(false);
	const rightPageRef = useRef(false);
	const { 1: get } = useKeyboardControls();
	const targetPositions = useRef([idleOffsetPosition, idleQuaternion]);
	const { actions } = useAnimations(animations, scene);
	const page = useRef(0);

	useFrame(({ camera, scene }, deltaTime) => {
		if (!bookRef.current) return;

		const keys = get();
		const interacting = !interactingRef.current && keys.book;
		const rightPage = !rightPageRef.current && keys.left;
		const leftPage = !leftPageRef.current && keys.right;

		interactingRef.current = keys.book;
		leftPageRef.current = keys.right;
		rightPageRef.current = keys.left;

		if (interacting) {
			isOpen.current = !isOpen.current;
			setBookOpen(isOpen.current);

			targetPositions.current = isOpen.current
				? [focusOffsetPosition, focusOffsetQuaternion]
				: [idleOffsetPosition, idleQuaternion];

			const action = actions.NlaTrack1;

			if (action) {
				action.timeScale = [-1, +1][+isOpen.current] * 3;
				action.paused = false;
				action.loop = THREE.LoopOnce;
				action.clampWhenFinished = true;
				action.play();
			}
		}

		const plane1 = scene.getObjectByName("Plane_1")!;
		const plane2 = scene.getObjectByName("Plane_2")!;

		if (isOpen.current) {
			const leftAction = actions.NlaTrack2;
			const rightAction = actions["NlaTrack.3"];

			if (leftAction && leftPage && page.current < anomalies.length / 2 - 1) {
				leftAction.play();
				leftAction.time = 1.8;
				leftAction.timeScale = 2;
				leftAction.loop = THREE.LoopOnce;
				leftAction.clampWhenFinished = true;
				plane1.visible = plane2.visible = true;
				page.current++;
				loadPageTextures(true);
			}

			if (rightAction && rightPage && page.current > 0) {
				rightAction.play();
				rightAction.time = 2.4;
				rightAction.timeScale = 2;
				rightAction.loop = THREE.LoopOnce;
				rightAction.clampWhenFinished = true;
				plane1.visible = plane2.visible = true;
				page.current--;
				loadPageTextures(false);
			}

			if (
				!leftAction?.isRunning() &&
				!rightAction?.isRunning() &&
				(plane1.visible || plane2.visible)
			) {
				plane1.visible = plane2.visible = false;
				leftAction?.stop();
				rightAction?.stop();
			}
		} else if (plane1.visible || plane2.visible) {
			plane1.visible = plane2.visible = false;
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
			const mesh = child as THREE.Mesh;
			if (!mesh.isMesh) return;

			const mat = mesh.material as THREE.MeshStandardMaterial;
			if (mat.name === name) {
				const cloned = mat.clone();
				mesh.material = cloned;
				found = cloned;
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

	const loadPageTextures = (rotatingLeft: boolean | null = null) => {
		const materials: THREE.MeshStandardMaterial[] = [];
		const newUrls: string[] = [];

		for (let i = 0; i < 2; i++) {
			materials.push(getMaterialByName(scene, BOOK_PAGES[i])!);
		}

		for (let i = 0; i < 2; i++) {
			const anomaly = anomalies[page.current * 2 + i];
			const url = new URL("http://localhost:8080/book-page");

			if (anomaly) {
				url.searchParams.append(
					"d",
					btoa(
						JSON.stringify({
							step: 0,
							anomaly: anomaly.id,
							syllables: anomaly.syllables,
						}),
					),
				);
			}

			newUrls[i] = url.toString();
		}

		const [leftMaterial, rightMaterial] = materials;
		const [leftNewUrl, rightNewUrl] = newUrls;
		const plane1 = scene.getObjectByName("Plane_1") as THREE.Mesh;
		const plane2 = scene.getObjectByName("Plane_2") as THREE.Mesh;

		if (rotatingLeft === true) {
			(plane1.material as THREE.MeshStandardMaterial).copy(rightMaterial);

			replaceTexture(rightMaterial, rightNewUrl);
			setTimeout(() => replaceTexture(leftMaterial, leftNewUrl), 150);
			return;
		}

		if (rotatingLeft === false) {
			(plane2.material as THREE.MeshStandardMaterial).copy(leftMaterial);

			replaceTexture(leftMaterial, leftNewUrl);
			setTimeout(() => replaceTexture(rightMaterial, rightNewUrl), 150);
			return;
		}

		replaceTexture(leftMaterial, leftNewUrl);
		replaceTexture(rightMaterial, rightNewUrl);
	};

	useEffect(() => {
		const action = actions.NlaTrack1;

		if (action) {
			action.timeScale = -Infinity;
			action.loop = THREE.LoopOnce;
			action.clampWhenFinished = true;
			action.play();
		}

		scene.getObjectByName("Plane_1")!.visible = false;
		scene.getObjectByName("Plane_2")!.visible = false;

		loadPageTextures();
	}, []);

	return (
		<group ref={bookRef}>
			<primitive object={scene} />
		</group>
	);
}
