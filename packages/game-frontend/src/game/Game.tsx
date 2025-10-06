import { Canvas, events } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import PostProcessing from "./components/shaders/PostProcessing";
import { DEFAULT_OPTIONS, type Options } from "@/constants/Options";
import KeyboardControls from "./components/controls/KeyboardControls";
import PointerLockControls from "./components/controls/PointerLockControls";
import { Physics } from "@react-three/rapier";
import MapManager from "./components/managers/MapManager";
import Loading from "@/ui/modals/Loading";
import useLobby from "@/hooks/useLobby";
import useClient from "@/hooks/useClient";
import type { Vec2 } from "@mansion/shared/types/util";
import React from "react";
import Menu from "@/ui/modals/Menu";
import PlayerManager from "./components/managers/PlayerManager";
import Hud from "@/ui/gui/Hud";
import type { ModalRef } from "@/ui/components/Modal";
import Stats from "./components/Stats";
import { Preload } from "@react-three/drei";
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
          fog: new THREE.FogExp2(0x170312, 0.25),
          background: new THREE.Color(0x170312),
        }}
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
        shadows={{
          enabled: options.shadows ?? DEFAULT_OPTIONS.shadows,
          type: THREE.PCFSoftShadowMap,
          autoUpdate: true,
          needsUpdate: false,
        }}
      >
        <Suspense fallback={<THREELoading />}>
          <perspectiveCamera fov={75} near={0.1} far={1000} />
          <PostProcessing />
          <ambientLight intensity={0.2} color={new THREE.Color(0xe2a8f0)} />
          {options.showHelper && <axesHelper args={[50]} />}
          {options.showHelper && <gridHelper args={[100, 100]} />}
          <Physics
            gravity={[0, options.fly ? 0 : -22, 0]}
            debug={options.showHelper}
            numSolverIterations={8}
            numAdditionalFrictionIterations={8}
          >
            <KeyboardControls spawn={spawn} />
            <PointerLockControls />
            <MapManager />
            <PlayerManager />
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
