import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
import type { ComponentProps } from "../pages/Options";
import styles from "../styles/modules/components/SliderOption.module.scss";

export type SliderOptionProps = ComponentProps & {
  value: number;
  min: number;
  max: number;
  step: number;
  valueFormat?: (value: number) => string;
  onChange: (value: number) => void;
};

export default function SliderOption({
  label,
  value,
  min,
  max,
  step,
  requiresReload,
  valueFormat,
  onChange,
  hover,
}: SliderOptionProps) {
  const decrease = () => {
    const newValue = Math.round(Math.max(value - step, min) * 100) / 100;
    onChange(newValue);
  };

  const increase = () => {
    const newValue = Math.round(Math.min(value + step, max) * 100) / 100;
    onChange(newValue);
  };

  return (
    <li className={styles.container}>
      <p className={styles.label}>
        <span>
          {label}
          {requiresReload && <span className={styles.requiresReload}> *</span>}
        </span>
        <span className={styles.value}>
          {valueFormat ? valueFormat(value) : value}
        </span>
      </p>
      <div className={styles.sliderBox}>
        <button
          className={styles.decreaseButton}
          onClick={decrease}
          onMouseEnter={hover}
        >
          <FaCaretLeft size={16} />
        </button>
        <div className={styles.sliderContainer} onMouseEnter={hover}>
          <input
            className={styles.slider}
            type="range"
            min={min}
            max={max}
            step={step}
            defaultValue={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span
            className={styles.valueProgress}
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>
        <button
          className={styles.increaseButton}
          onClick={increase}
          onMouseEnter={hover}
        >
          <FaCaretRight size={16} />
        </button>
      </div>
    </li>
  );
}
