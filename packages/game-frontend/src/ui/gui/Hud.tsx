import styles from "../styles/modules/gui/Hud.module.scss";
import Minimap from "./Minimap";

export default function Hud() {
  return (
    <div className={styles.container}>
      <Minimap />
    </div>
  );
}
