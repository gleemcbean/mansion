import type { IconType } from "react-icons";
import styles from "../styles/modules/components/ProgressBar.module.scss";

type ProgressBarProps = {
	color: string;
	width?: number;
	height?: number;
	value: number;
	maxValue: number;
	iconSize?: number;
	Icon?: IconType;
};

export default function ProgressBar({
	color,
	width = 500,
	height = 35,
	value,
	maxValue,
	iconSize = height,
	Icon,
}: ProgressBarProps) {
	return (
		<div className={styles.container}>
			{Icon && <Icon fill={color} size={iconSize} />}
			<div
				className={styles.progressBar}
				style={{ width, height, backgroundColor: `${color}44` }}
			>
				<span
					className={styles.progression}
					style={{
						width: `${(value / maxValue) * 100}%`,
						backgroundColor: color,
					}}
				/>
			</div>
		</div>
	);
}
