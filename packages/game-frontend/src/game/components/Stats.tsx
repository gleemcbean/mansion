import { Stats as DREIStats } from "@react-three/drei";
import useClient from "@/hooks/useClient";

export default function Stats() {
	const { options } = useClient();

	if (!options.stats) return null;
	return <DREIStats />;
}
