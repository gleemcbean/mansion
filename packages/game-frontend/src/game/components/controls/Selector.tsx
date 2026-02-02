import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type SelectorProps = {
	distance?: number;
	onHit?: (hit: THREE.Intersection | null) => void;
	filter?: (obj: THREE.Object3D) => boolean;
};

export default function Selector({
	distance = 1,
	onHit,
	filter,
}: SelectorProps) {
	const raycaster = useRef(new THREE.Raycaster());

	useEffect(() => {
		raycaster.current.far = distance;
		raycaster.current.near = 0.3;
		raycaster.current.params.Mesh = { side: THREE.FrontSide };
	}, [distance]);

	useFrame(({ camera, scene }) => {
		const origin = camera.getWorldPosition(new THREE.Vector3());
		const dir = camera.getWorldDirection(new THREE.Vector3()).normalize();
		raycaster.current.set(origin, dir);

		const candidates: THREE.Object3D[] = [];

		scene.traverse((obj) => {
			if (!filter || filter(obj)) {
				candidates.push(obj);
			}
		});

		const hits = raycaster.current.intersectObjects(candidates, true);
		const first = hits[0] ?? null;
		onHit?.(first);
	});

	return null;
}
