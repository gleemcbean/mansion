import { EffectComposer } from "@react-three/postprocessing";
import usePlayer from "@/hooks/useClient";
import Pass from "./Pass";

export default function PostProcessing() {
	const { options } = usePlayer();

	return (
		options.doPostProcessing && (
			<EffectComposer>
				<Pass />
			</EffectComposer>
		)
	);
}
