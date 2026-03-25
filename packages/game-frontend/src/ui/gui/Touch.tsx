import { BsShiftFill } from "react-icons/bs";
import { MdSpaceBar } from "react-icons/md";
import styles from "../styles/modules/gui/Touch.module.scss";

type TouchProps = {
	value: string;
};

export default function Touch({ value }: TouchProps) {
	if (/^Key[A-Z]$/.test(value)) {
		return <div className={styles.touchSquare}>{value.slice(3)}</div>;
	} else if (/^Shift(?:Left|Right)?$/.test(value)) {
		return (
			<div className={styles.touch}>
				<BsShiftFill className={styles.icon} />
			</div>
		);
	} else if (/^Control(?:Left|Right)?$/.test(value)) {
		return <div className={styles.touch}>Ctrl</div>;
	} else if (value === "Space") {
		return (
			<div className={styles.touch}>
				<MdSpaceBar className={styles.icon} />
			</div>
		);
	} else {
		return null;
	}
}
