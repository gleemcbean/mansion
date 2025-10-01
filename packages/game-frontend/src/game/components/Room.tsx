import useClient from "@/hooks/useClient";
import type { PositionedRoom } from "@mansion/shared/utils/Map";
import { Gltf } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";

type RoomProps = {
  data: PositionedRoom;
};

export default function Room({ data }: RoomProps) {
  const { options } = useClient();

  const {
    position: [x, z],
    rotationY,
  } = useMemo(() => {
    return {
      position: data.position,
      rotationY: (Math.PI / 2) * -data.direction,
    };
  }, [data.position, data.direction]);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={0}>
      <Gltf
        src={`/models/rooms/${data.id}.glb`}
        position={[x, 0, z]}
        rotation={[0, rotationY, 0]}
        castShadow={options.shadows}
        receiveShadow={options.shadows}
      />
    </RigidBody>
  );
}
