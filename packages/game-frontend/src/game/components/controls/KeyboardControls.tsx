import usePlayer from "@/hooks/useClient";
import type { Vec2 } from "@mansion/shared/types/util";
import {
  KeyboardControls as DREIKeyboardControls,
  useKeyboardControls,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  PL_CROUCH_SPEED_MULTIPLIER,
  PL_FLY_SPEED_MULTIPLIER,
  PL_FOV,
  PL_HEIGHT,
  PL_JUMP_FORCE,
  PL_MAX_STAMINA,
  PL_SPEED,
  PL_SPRINT_FOV,
  PL_SPRINT_SPEED_MULTIPLIER,
  PL_THICKNESS,
  PL_EYE_DISTANCE,
  PL_CROUCH_HEIGHT,
} from "@mansion/shared/constants/player";
import useClient from "@/hooks/useClient";
import useWebsocket from "@/hooks/useWebsocket";
import { ClientPacketType } from "@mansion/shared/types/packets";
import type { PlayerGameData } from "@mansion/shared/types/player";
import useLobby from "@/hooks/useLobby";
import { GameMap } from "@mansion/shared/utils/Map";

type KeyboardControlsProps = {
  spawn: Vec2;
};

function KeyboardControlsLogic({ spawn }: KeyboardControlsProps) {
  const body = useRef<RapierRigidBody>(null);
  const [lighting, setLighting] = useState({ value: false, ready: true });
  const [height, setHeight] = useState(PL_HEIGHT);
  const targetHeight = useRef(PL_HEIGHT);
  const lastSent = useRef(0);
  const lastEnergyDrain = useRef(0);
  const energy = useRef(100);
  const fovRef = useRef(PL_FOV);
  const targetFovRef = useRef(PL_FOV);
  const oldQuat = useRef(new THREE.Quaternion());
  const oldPos = useRef(new THREE.Vector3());
  const jRaycaster = useRef(new THREE.Raycaster());
  const cRaycaster = useRef(new THREE.Raycaster());
  const { 1: get } = useKeyboardControls();
  const { camera } = useThree();
  const { options, room, setRoom, setGameData } = useClient();
  const { metadata } = useLobby();
  const { send } = useWebsocket();

  const map = useMemo(() => GameMap.fromJSON(metadata!.map), [metadata]);

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, "YXZ");

  useEffect(() => {
    body.current?.setTranslation(
      {
        x: spawn[0],
        y: targetHeight.current / 2 + PL_THICKNESS + 0.1,
        z: spawn[1],
      },
      false
    );

    jRaycaster.current.far =
      targetHeight.current / 2 + PL_THICKNESS + PL_EYE_DISTANCE + 0.05;

    cRaycaster.current.far =
      targetHeight.current / 2 + PL_THICKNESS - PL_EYE_DISTANCE + 0.05;

    jRaycaster.current.near = cRaycaster.current.near = 0;

    jRaycaster.current.params.Mesh = cRaycaster.current.params.Mesh = {
      side: THREE.FrontSide,
    };
  }, [targetHeight.current]);

  useFrame(({ scene }, delta) => {
    if (!body.current) return;

    const sendPosPacket = (data: PlayerGameData) => {
      const now = performance.now();
      if (now - lastSent.current < 50) return;
      lastSent.current = now;
      send(ClientPacketType.PlayerUpdate, { gameData: data });
    };

    const oldEnergy = energy.current;
    const keys = get();
    const forward = Number(keys.forward);
    const backward = Number(keys.backward);
    const left = Number(keys.left);
    const right = Number(keys.right);
    const sprint = keys.sprint;
    const jump = keys.jump;
    const crouch = keys.crouch && !options.fly;
    const lightPressed = keys.light;

    if (sprint && !options.godMode) energy.current -= delta * 10;
    if (lighting.value && !options.godMode) energy.current -= delta * 6;
    energy.current = Math.max(0, energy.current);

    if (energy.current !== oldEnergy) {
      lastEnergyDrain.current = Date.now();
    }

    if (
      energy.current === oldEnergy &&
      lastEnergyDrain.current + 1000 < Date.now()
    ) {
      energy.current = Math.min(PL_MAX_STAMINA, energy.current + delta * 6);
    }

    const canSprint = sprint && energy.current > 1;
    const canLight = lighting.value && energy.current > 0;

    if ((lightPressed && lighting.ready) || (lighting.value && !canLight)) {
      setLighting((prev) => ({ value: !prev.value, ready: false }));
    }

    if (!lightPressed && !lighting.ready) {
      setLighting((prev) => ({ ...prev, ready: true }));
    }

    const vel = body.current.linvel();
    const yVel = vel?.y ?? 0;

    frontVector.set(0, 0, backward - forward);
    sideVector.set(left - right, 0, 0);
    direction.subVectors(frontVector, sideVector);

    if (options.fly) {
      direction.y = Number(keys.jump) - Number(keys.crouch);
    }

    direction.normalize();
    euler.set(0, camera.rotation.y, 0);
    direction.applyEuler(euler);

    const currentSpeed =
      PL_SPEED *
      options.speed *
      (canSprint ? PL_SPRINT_SPEED_MULTIPLIER : 1) *
      (crouch ? PL_CROUCH_SPEED_MULTIPLIER : 1) *
      (options.fly ? PL_FLY_SPEED_MULTIPLIER : 1);

    direction.multiplyScalar(currentSpeed);
    body.current.setGravityScale(options.fly ? 0 : 1, false);

    if (direction.lengthSq() > 0) {
      body.current.wakeUp?.();

      targetFovRef.current =
        sprint && energy.current > 0 ? PL_SPRINT_FOV : PL_FOV;

      body.current.setLinvel(
        {
          x: direction.x,
          y: options.fly ? direction.y : yVel,
          z: direction.z,
        },
        true
      );
    } else {
      if (!sprint) targetFovRef.current = PL_FOV;

      body.current.setLinvel(
        {
          x: direction.x * 0.9,
          y: options.fly ? direction.y * 0.9 : yVel,
          z: direction.z * 0.9,
        },
        true
      );
    }

    const candidates: THREE.Object3D[] = [];
    scene.traverse((obj) => candidates.push(obj));

    const jOrigin = camera.getWorldPosition(new THREE.Vector3());
    const jDir = new THREE.Vector3(0, -1, 0).normalize();
    jRaycaster.current.set(jOrigin, jDir);
    let hits = jRaycaster.current.intersectObjects(candidates, true);
    const grounded = !!hits[0];

    if (jump && grounded && yVel < 0.001) {
      body.current.applyImpulse(
        { x: direction.x, y: PL_JUMP_FORCE, z: direction.z },
        true
      );
    }

    const cOrigin = camera.getWorldPosition(new THREE.Vector3());
    const cDir = new THREE.Vector3(0, 1, 0).normalize();
    cRaycaster.current.set(cOrigin, cDir);
    hits = cRaycaster.current.intersectObjects(candidates, true);
    const canDecrouch = !!hits[0];

    if (crouch) console.log(canDecrouch);

    targetHeight.current = PL_HEIGHT;
    if (crouch || (!crouch && !canDecrouch))
      targetHeight.current = PL_CROUCH_HEIGHT;

    setHeight((prev) => prev + (targetHeight.current - prev) * delta * 5);

    const t = body.current.translation();
    const q = camera.quaternion.clone();
    camera.position.set(t.x, t.y + PL_EYE_DISTANCE, t.z);

    if (
      !oldQuat.current.equals(q) ||
      !oldPos.current.equals(t) ||
      !lighting.ready ||
      oldEnergy !== energy.current
    ) {
      const newGameData: PlayerGameData = {
        position: [t.x, t.y, t.z],
        quaternion: q,
        crouched: crouch,
        running: sprint,
        health: 100,
        energy: energy.current,
        lighting: lighting.value,
      };

      setGameData(newGameData);
      sendPosPacket(newGameData);
    }

    oldQuat.current.copy(q);
    oldPos.current.copy(t);

    if ("fov" in camera) {
      fovRef.current += (targetFovRef.current - fovRef.current) * delta * 10;
      camera.fov = fovRef.current;
      camera.updateProjectionMatrix();
    }

    map.rooms.forEach((r) => {
      if (room === r.name || !r.pointIn([t.x, t.z])) return;
      setRoom(r.name);
    });
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      mass={50}
      lockRotations={true}
      linearDamping={0.5}
      angularDamping={1}
      friction={0}
    >
      {!options.noClip && <CapsuleCollider args={[height / 2, PL_THICKNESS]} />}
      <pointLight
        position={[0, height / 2, 0]}
        intensity={6}
        distance={8}
        decay={0.4}
        color={0xe8a7f0}
        visible={lighting.value}
      />
    </RigidBody>
  );
}

export default function KeyboardControls({ spawn }: KeyboardControlsProps) {
  const { options } = usePlayer();

  const keyify = useCallback(
    (key: (string | null)[]) => {
      return key.filter((o) => o) as [string, string];
    },
    [options]
  );

  return (
    <DREIKeyboardControls
      map={[
        { name: "forward", keys: keyify(options.forward) },
        { name: "backward", keys: keyify(options.backward) },
        { name: "left", keys: keyify(options.left) },
        { name: "right", keys: keyify(options.right) },
        { name: "jump", keys: keyify(options.up) },
        { name: "sprint", keys: keyify(options.sprint) },
        { name: "crouch", keys: keyify(options.crouch) },
        { name: "light", keys: keyify(options.light) },
      ]}
    >
      <KeyboardControlsLogic spawn={spawn} />
    </DREIKeyboardControls>
  );
}
