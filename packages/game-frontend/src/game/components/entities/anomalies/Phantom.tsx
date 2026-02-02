import type Anomaly from "@mansion/shared/utils/Anomaly";

type PhantomProps = {
	data: Anomaly;
};

export default function Phantom({ data }: PhantomProps) {
	return (
		<mesh position={data.position} rotation={data.rotation}>
			<boxGeometry attach="geometry" args={[1, 1, 1]} />
			<meshStandardMaterial attach="material" color="#6b71e0" />
		</mesh>
	);
}
