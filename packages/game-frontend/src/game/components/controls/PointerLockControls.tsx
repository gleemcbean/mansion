import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import usePlayer from "@/hooks/useClient";

type PointerLockControlsProps = {
	sensitivity?: number;
	minPolarAngle?: number;
	maxPolarAngle?: number;
	smooth?: boolean;
	damping?: number;
};

const ANTI_GITTER_THRESHOLD = 300;

export default function PointerLockControls({
	sensitivity = 0.002,
	minPolarAngle = -Math.PI / 2 + 0.05,
	maxPolarAngle = Math.PI / 2 - 0.05,
	smooth = true,
	damping = 0.6,
}: PointerLockControlsProps) {
	const { camera, gl } = useThree();
	const { options } = usePlayer();

	const yaw = useRef(0);
	const pitch = useRef(0);
	const targetYaw = useRef(0);
	const targetPitch = useRef(0);

	useEffect(() => {
		gl.domElement.requestPointerLock();

		const handleMouseMove = (e: MouseEvent) => {
			if (document.pointerLockElement !== gl.domElement) return;

			const movementDistance = Math.sqrt(
				e.movementX * e.movementX + e.movementY * e.movementY,
			);

			if (movementDistance > ANTI_GITTER_THRESHOLD) return;

			targetYaw.current -= e.movementX * sensitivity;
			targetPitch.current -= e.movementY * sensitivity;

			targetPitch.current = Math.max(
				minPolarAngle,
				Math.min(maxPolarAngle, targetPitch.current),
			);
		};

		const handleClick = () => {
			gl.domElement.requestPointerLock();
		};

		const canvas = document.querySelector("canvas")!;

		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("click", handleClick);

		return () => {
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("click", handleClick);
		};
	}, [gl, sensitivity, minPolarAngle, maxPolarAngle]);

	useFrame(() => {
		if (smooth) {
			yaw.current += (targetYaw.current - yaw.current) * damping;
			pitch.current += (targetPitch.current - pitch.current) * damping;
		} else {
			yaw.current = targetYaw.current;
			pitch.current = targetPitch.current;
		}

		camera.rotation.set(
			pitch.current * (options.invertY ? -1 : 1),
			yaw.current,
			0,
			"YXZ",
		);
	});

	return null;
}
