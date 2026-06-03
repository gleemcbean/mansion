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

const ANTI_GITTER_THRESHOLD_SQ = 300 ** 2;

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

	const sensitivityRef = useRef(sensitivity);
	const minPolarAngleRef = useRef(minPolarAngle);
	const maxPolarAngleRef = useRef(maxPolarAngle);
	const smoothRef = useRef(smooth);
	const dampingRef = useRef(damping);

	sensitivityRef.current = sensitivity;
	minPolarAngleRef.current = minPolarAngle;
	maxPolarAngleRef.current = maxPolarAngle;
	smoothRef.current = smooth;
	dampingRef.current = damping;

	useEffect(() => {
		const canvas = gl.domElement;

		canvas.requestPointerLock();

		const handleMouseMove = (e: MouseEvent) => {
			if (document.pointerLockElement !== canvas) return;

			const distSq = e.movementX * e.movementX + e.movementY * e.movementY;
			if (distSq > ANTI_GITTER_THRESHOLD_SQ) return;

			targetYaw.current -= e.movementX * sensitivityRef.current;
			targetPitch.current -= e.movementY * sensitivityRef.current;
			targetPitch.current = Math.max(
				minPolarAngleRef.current,
				Math.min(maxPolarAngleRef.current, targetPitch.current),
			);
		};

		const handleClick = () => canvas.requestPointerLock();

		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("click", handleClick);

		return () => {
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("click", handleClick);
		};
	}, [gl]);

	useFrame(() => {
		if (smoothRef.current) {
			yaw.current += (targetYaw.current - yaw.current) * dampingRef.current;
			pitch.current +=
				(targetPitch.current - pitch.current) * dampingRef.current;
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
