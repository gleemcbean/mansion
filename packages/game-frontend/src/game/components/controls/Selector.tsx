import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import useClient from "@/hooks/useClient";

type SelectorProps = {
	distance?: number;
	onHit?: (hit: THREE.Object3D | null) => void;
	filter?: (obj: THREE.Object3D) => boolean;
};

const _origin = new THREE.Vector3();
const _dir = new THREE.Vector3();

function findActionObject(obj: THREE.Object3D | null): THREE.Object3D | null {
	let current = obj;
	while (current) {
		if (current.userData?.execute) return current;
		if (!current.parent || current.parent.type === "Scene") return null;
		current = current.parent;
	}
	return null;
}

export default function Selector({ distance = 1 }: SelectorProps) {
	const { 1: get } = useKeyboardControls();
	const { setSelectorTooltip } = useClient();
	const { scene } = useThree();

	const raycaster = useRef(new THREE.Raycaster());
	const interactingRef = useRef(false);
	const currentTooltip = useRef<string | null>(null);
	const sceneObjectsRef = useRef<THREE.Object3D[]>([]);

	useEffect(() => {
		raycaster.current.far = distance;
		raycaster.current.near = 0.3;
	}, [distance]);

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

	useFrame(({ camera }) => {
		const keys = get();
		const interacting = !interactingRef.current && keys.interact;
		interactingRef.current = keys.interact;

		camera.getWorldPosition(_origin);
		camera.getWorldDirection(_dir);

		raycaster.current.set(_origin, _dir);

		const hits = raycaster.current.intersectObjects(
			sceneObjectsRef.current,
			true,
		);
		const actionObj = findActionObject(hits[0]?.object ?? null);

		if (!actionObj) {
			if (currentTooltip.current !== null) {
				currentTooltip.current = null;
				setSelectorTooltip(null);
			}
			return;
		}

		const { userData } = actionObj;

		if (interacting) userData.execute();

		if (currentTooltip.current !== userData.title) {
			currentTooltip.current = userData.title;
			setSelectorTooltip(userData.title);
		}
	});

	return null;
}
