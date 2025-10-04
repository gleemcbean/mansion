import { FaBoltLightning } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";
import styles from "../styles/modules/gui/Hud.module.scss";
import Minimap from "./Minimap";
import { FaHeart } from "react-icons/fa";

export default function Hud() {
  return (
    <div className={styles.container}>
      <Minimap />
      <div className={styles.progressions}>
        <ProgressBar
          color="#39ade3"
          value={20}
          maxValue={100}
          height={20}
          width={500}
          Icon={FaBoltLightning}
          iconSize={20}
        />
        <ProgressBar
          color="#e33941"
          value={50}
          maxValue={100}
          Icon={FaHeart}
          iconSize={20}
        />
      </div>
    </div>
  );
}
