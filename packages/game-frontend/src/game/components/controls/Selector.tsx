import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import useClient from "@/hooks/useClient";

type SelectorProps = {
	distance?: number;
	onHit?: (hit: THREE.Object3D | null) => void;
	filter?: (obj: THREE.Object3D) => boolean;
};

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
	const { selectorTooltip, setSelectorTooltip } = useClient();
	const raycaster = useRef(new THREE.Raycaster());
	const interactingRef = useRef(false);

	useEffect(() => {
		raycaster.current.far = distance;
		raycaster.current.near = 0.3;
	}, [distance]);

	useFrame(({ camera, scene }) => {
		const keys = get();

		const interacting = !interactingRef.current && keys.interact;
		interactingRef.current = keys.interact;

		const origin = camera.getWorldPosition(new THREE.Vector3());
		const dir = camera.getWorldDirection(new THREE.Vector3()).normalize();
		raycaster.current.set(origin, dir);

		const hits = raycaster.current.intersectObjects(scene.children, true);
		const rawHit = hits[0]?.object ?? null;
		const actionObj = findActionObject(rawHit);

		if (!actionObj) {
			if (selectorTooltip) setSelectorTooltip(null);
			return;
		}

		const { userData } = actionObj;
		if (interacting) userData.execute();
		if (selectorTooltip !== userData.title) setSelectorTooltip(userData.title);
	});

	return null;
}
