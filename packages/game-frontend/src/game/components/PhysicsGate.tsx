import { useProgress } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import type React from "react";
import { useEffect, useState } from "react";
import useClient from "@/hooks/useClient";

type PhysicsGateProps = {
	children: React.ReactNode | React.ReactNode[];
};

export default function PhysicsGate({ children }: PhysicsGateProps) {
	const [ready, setReady] = useState(false);

	const { options } = useClient();
	const { active, progress } = useProgress();

	useEffect(() => {
		if (active || progress < 100) return;
		const t = setTimeout(() => setReady(true), 250);
		return () => clearTimeout(t);
	}, [active, progress]);

	return (
		<Physics
			gravity={[0, options.fly ? 0 : -22, 0]}
			debug={options.showHelper}
			numSolverIterations={8}
			paused={!ready}
		>
			{children}
		</Physics>
	);
}
