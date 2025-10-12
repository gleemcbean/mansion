import type { PositionedRoom } from "@mansion/shared/utils/Map";
import { Gltf } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";

type RoomProps = {
  data: PositionedRoom;
};

export default function Room({ data }: RoomProps) {
  const {
    position: [x, z],
    rotationY,
    lights,
  } = useMemo(() => {
    return {
      position: data.position,
      rotationY: (Math.PI / 2) * -data.direction,
      lights: data.t_lights,
    };
  }, [data.position, data.direction]);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={0}>
      <Gltf
        src={`/models/rooms/${data.id}.glb`}
        position={[x, 0, z]}
        rotation={[0, rotationY, 0]}
      />
      {lights.map((light) => {
        if (light.target) {
          const target = new THREE.Object3D();
          target.position.set(0, -0.5, 0);

          return (
            <spotLight
              key={light.position.join(",")}
              position={light.position}
              color={light.color ?? 0xe8a7f0}
              intensity={light.intensity ?? 4}
              target={target}
              distance={light.decay}
            />
          );
        }

        return (
          <pointLight
            key={light.position.join(",")}
            position={light.position}
            color={light.color ?? 0xe8a7f0}
            decay={light.decay ?? 1.5}
            intensity={light.intensity ?? 4}
          />
        );
      })}
    </RigidBody>
  );
}
