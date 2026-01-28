import type Anomaly from "@mansion/shared/utils/Anomaly";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useState } from "react";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

type TentaclesProps = {
	data: Anomaly;
};

export default function Tentacles({ data }: TentaclesProps) {
	// const { scene } = useGLTF("/models/anomalies/tentacle.glb");
	// const tentacles = useMemo(() => SkeletonUtils.clone(scene), [scene]);

	// const [rotationY, setRotationY] = useState(0);

	// useEffect(() => {
	// 	tentacles.rotation.y = -Math.PI / 2;
	// 	tentacles.rotation.x = -Math.PI / 2;
	// }, []);

	// useFrame(({ clock }) => {
	// 	// setRotationY(Math.cos(clock.elapsedTime * 10));
	// });

	// return (
	// 	<RigidBody type="dynamic" rotation={[0, rotationY, 0]}>
	// 		<group position={data.position} rotation={data.rotation}>
	// 			<primitive object={tentacles} />
	// 		</group>
	// 	</RigidBody>
	// );

	return null;
}
