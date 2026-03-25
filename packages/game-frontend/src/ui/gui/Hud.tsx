import {
	PL_MAX_HEALTH,
	PL_MAX_STAMINA,
} from "@mansion/shared/constants/player";
import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { FaBoltLightning } from "react-icons/fa6";
import useClient from "@/hooks/useClient";
import ProgressBar from "../components/ProgressBar";
import styles from "../styles/modules/gui/Hud.module.scss";
import Minimap from "./Minimap";
import Touch from "./Touch";

export default function Hud() {
	const { active, progress } = useProgress();
	const { options, selectorTooltip, subGameData } = useClient();
	const [gameData, setGameData] = useState({
		health: PL_MAX_HEALTH,
		energy: PL_MAX_STAMINA,
	});

	useEffect(() => {
		const unsubscribe = subGameData((data) => {
			setGameData({
				health: data.health,
				energy: data.energy,
			});
		});

		return () => unsubscribe();
	}, []);

	if (!options.hud || active || progress < 100) return null;

	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<Minimap />
				<div className={styles.progressions}>
					<ProgressBar
						color="#39dde3"
						value={gameData.energy}
						maxValue={PL_MAX_HEALTH}
						height={20}
						Icon={FaBoltLightning}
						iconSize={20}
					/>
					<ProgressBar
						color="#e33941"
						value={gameData.health}
						maxValue={PL_MAX_STAMINA}
						Icon={FaHeart}
						iconSize={20}
					/>
				</div>
			</div>
			{selectorTooltip && (
				<p className={styles.selectorTooltip}>
					<span>
						Press <Touch value={options.interact[0]!} /> to{" "}
					</span>
					<span>{selectorTooltip.toLowerCase()}</span>
				</p>
			)}
			<div className={styles.topTooltip}>
				<p>
					<Touch value={options.sprint[0]!} />
					<span> Sprint</span>
				</p>
				<p>
					<Touch value={options.crouch[0]!} />
					<span> Hide</span>
				</p>
				<p>
					<Touch value={options.light[0]!} />
					<span> Toggle flashlight</span>
				</p>
			</div>
		</div>
	);
}
