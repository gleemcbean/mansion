import type { Vec2 } from "@mansion/shared/types/util";
import { Preload } from "@react-three/drei";
import { Canvas, events } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DEFAULT_OPTIONS, type Options } from "@/constants/Options";
import useClient from "@/hooks/useClient";
import useLobby from "@/hooks/useLobby";
import type { ModalRef } from "@/ui/components/Modal";
import Hud from "@/ui/gui/Hud";
import Loading from "@/ui/modals/Loading";
import Menu from "@/ui/modals/Menu";
import KeyboardControls from "./components/controls/KeyboardControls";
import PointerLockControls from "./components/controls/PointerLockControls";
import Selector from "./components/controls/Selector";
import AnomalyManager from "./components/managers/AnomalyManager";
import MapManager from "./components/managers/MapManager";
import PlayerManager from "./components/managers/PlayerManager";
import Stats from "./components/Stats";
import PostProcessing from "./components/shaders/PostProcessing";
import THREELoading from "./Loading";

export default function Game() {
	const [options, setOptions] = useState<Partial<Options> | null>(null);
	const { metadata } = useLobby();
	const { client } = useClient();
	const menuRef = useRef<ModalRef | null>(null);

	const spawn = useMemo(() => {
		const { 0: x, 2: z } = client.playerData!.gameData!.position;
		return [x, z] as Vec2;
	}, []);

	useEffect(() => {
		setOptions(JSON.parse(localStorage.getItem("options") || "{}"));

		const menuToggle = () => {
			if (document.pointerLockElement) {
				menuRef.current?.close();
			} else {
				menuRef.current?.open();
			}
		};

		document.addEventListener("pointerlockchange", menuToggle);

		return () => document.removeEventListener("pointerlockchange", menuToggle);
	}, []);

	if (!options || !metadata) return <Loading />;

	return (
		<React.Fragment>
			<Canvas
				flat
				linear
				scene={{
					fog: new THREE.FogExp2(0x170312, 0.18),
					background: new THREE.Color(0x170312),
				}}
				camera={{ near: 0.001, far: 10, fov: 90 }}
				gl={{
					antialias: false,
					powerPreference: "high-performance",
					alpha: false,
					stencil: false,
					depth: true,
					logarithmicDepthBuffer: true,
					outputColorSpace: "srgb-linear",
					toneMapping: THREE.NoToneMapping,
					toneMappingExposure: 1.25,
				}}
				events={events}
				dpr={options.dpr ?? DEFAULT_OPTIONS.dpr}
				shadows={{ type: THREE.BasicShadowMap }}
			>
				<Suspense fallback={<THREELoading />}>
					<PostProcessing />
					<ambientLight intensity={0.8} color={new THREE.Color(0xe9b5f5)} />
					{options.showHelper && <axesHelper args={[50]} />}
					{options.showHelper && <gridHelper args={[100, 100]} />}
					<Physics
						gravity={[0, options.fly ? 0 : -22, 0]}
						debug={options.showHelper}
						numSolverIterations={8}
					>
						<KeyboardControls spawn={spawn} />
						<Selector
							// onHit={(obj) => console.log(obj)}
							distance={2}
							filter={(obj) => obj.name === "Door"}
						/>
						<PointerLockControls />
						<MapManager />
						<PlayerManager />
						<AnomalyManager />
					</Physics>
					<Stats />
					<Preload all />
				</Suspense>
			</Canvas>
			<Hud />
			<Menu ref={menuRef} />
		</React.Fragment>
	);
}
