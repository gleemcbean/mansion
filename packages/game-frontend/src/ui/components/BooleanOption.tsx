import styles from "../styles/modules/components/BooleanOption.module.scss";
import type { ComponentProps } from "../pages/Options";

export type BooleanOptionProps = ComponentProps & {
  value: boolean;
  onChange: (value: boolean) => void;
};

export default function BooleanOption({
  label,
  value,
  requiresReload,
  onChange,
  hover,
}: BooleanOptionProps) {
  return (
    <li className={styles.container}>
      <p className={styles.label}>
        {label}
        {requiresReload && <span className={styles.requiresReload}> *</span>}
      </p>
      <div className={styles.buttons}>
        <span
          className={styles.value + " " + (value ? styles.on : styles.off)}
        />
        <button
          onClick={() => onChange(true)}
          className={styles.button + " " + styles.on}
          onMouseEnter={hover}
        >
          On
        </button>
        <button
          onClick={() => onChange(false)}
          className={styles.button + " " + styles.off}
          onMouseEnter={hover}
        >
          Off
        </button>
      </div>
    </li>
  );
}
