import { BsShiftFill } from "react-icons/bs";
import { MdSpaceBar } from "react-icons/md";
import styles from "../styles/modules/gui/Touch.module.scss";

type TouchProps = {
	value: string;
};

export default function Touch({ value }: TouchProps) {
	if (/^Key[A-Z]$/.test(value)) {
		return <span className={styles.touchSquare}>{value.slice(3)}</span>;
	} else if (/^Shift(?:Left|Right)?$/.test(value)) {
		return (
			<span className={styles.touch}>
				<BsShiftFill className={styles.icon} />
			</span>
		);
	} else if (/^Control(?:Left|Right)?$/.test(value)) {
		return <span className={styles.touch}>Ctrl</span>;
	} else if (value === "Space") {
		return (
			<span className={styles.touch}>
				<MdSpaceBar className={styles.icon} />
			</span>
		);
	} else {
		return null;
	}
}
