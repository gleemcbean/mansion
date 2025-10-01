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
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  PL_CROUCH_SPEED_MULTIPLIER,
  PL_FLY_SPEED_MULTIPLIER,
  PL_HEIGHT,
  PL_JUMP_FORCE,
  PL_SPEED,
  PL_SPRINT_SPEED_MULTIPLIER,
  PL_THICKNESS,
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
  const grounded = useRef(true);
  const lastSent = useRef(0);
  const oldQuat = useRef(new THREE.Quaternion());
  const oldPos = useRef(new THREE.Vector3());
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

  const collider = useRef<THREE.Mesh>(null);

  useEffect(() => {
    console.log(collider.current);
  }, [collider.current]);

  useFrame(() => {
    if (!body.current) return;

    const sendPosPacket = (data: PlayerGameData) => {
      const now = performance.now();
      if (now - lastSent.current < 50) return;
      lastSent.current = now;
      send(ClientPacketType.PlayerUpdate, { gameData: data });
    };

    const keys = get();
    const forward = Number(keys.forward);
    const backward = Number(keys.backward);
    const left = Number(keys.left);
    const right = Number(keys.right);
    const sprint = keys.sprint;
    const jump = keys.jump;
    const crouch = keys.crouch && !options.fly;

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
      (sprint ? PL_SPRINT_SPEED_MULTIPLIER : 1) *
      (crouch ? PL_CROUCH_SPEED_MULTIPLIER : 1) *
      (options.fly ? PL_FLY_SPEED_MULTIPLIER : 1);

    direction.multiplyScalar(currentSpeed);

    if (direction.lengthSq() > 0) {
      body.current.wakeUp?.();
      body.current.setLinvel(
        {
          x: direction.x,
          y: options.fly ? direction.y : yVel,
          z: direction.z,
        },
        true
      );
    } else {
      body.current.setLinvel(
        {
          x: direction.x * 0.9,
          y: options.fly ? direction.y * 0.9 : yVel,
          z: direction.z * 0.9,
        },
        true
      );
    }

    if (jump && grounded.current) {
      body.current.applyImpulse(
        { x: direction.x, y: PL_JUMP_FORCE, z: 0 },
        true
      );
      grounded.current = false;
    }

    const t = body.current.translation();
    const q = camera.quaternion.clone();
    camera.position.set(t.x, t.y + 0.2, t.z);

    if (!oldQuat.current.equals(q) || !oldPos.current.equals(t)) {
      const newGameData: PlayerGameData = {
        position: [t.x, t.y, t.z],
        quaternion: q,
        crouched: crouch,
        running: sprint,
      };

      setGameData(newGameData);
      sendPosPacket(newGameData);
    }

    oldQuat.current.copy(q);
    oldPos.current.copy(t);

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
      position={[spawn[0], 2.8, spawn[1]]}
      friction={0}
    >
      <CapsuleCollider args={[PL_HEIGHT / 2 - 0.08, PL_THICKNESS]} />
      <CapsuleCollider
        args={[0.2, 0.2]}
        position={[0, -PL_HEIGHT / 2 + 0.08, 0]}
        onCollisionEnter={() => (grounded.current = true)}
        onCollisionExit={() => (grounded.current = false)}
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
      ]}
    >
      <KeyboardControlsLogic spawn={spawn} />
    </DREIKeyboardControls>
  );
}
