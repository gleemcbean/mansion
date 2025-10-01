import { useState } from "react";
import type { ComponentProps } from "../pages/Options";
import styles from "../styles/modules/components/KeyOption.module.scss";

export type KeyOptionProps = ComponentProps & {
  value: [string | null, string | null];
  onChange: (value: [string | null, string | null]) => void;
};

type KeyProps = {
  value: string | null;
  setValue: (value: string | null) => void;
  hover: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

function Key({ value, setValue, hover }: KeyProps) {
  const [recording, setRecording] = useState(false);

  return (
    <button
      className={styles.keyButton}
      onMouseEnter={hover}
      onClick={() => {
        setRecording(true);

        const removeListeners = () => {
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("mousedown", onMouseDown);
        };

        const onKeyDown = (e: KeyboardEvent) => {
          e.preventDefault();
          setValue(e.code === "Escape" ? null : e.code);
          setRecording(false);
          removeListeners();
        };

        const onMouseDown = (e: MouseEvent) => {
          e.preventDefault();
          setValue(null);
          setRecording(false);
          removeListeners();
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("mousedown", onMouseDown);
      }}
    >
      {recording
        ? "Press a key"
        : value
        ? value
            .replace("Key", "")
            .replace("Digit", "")
            .replace(/(?<=[a-z])[A-Z]/g, (m) => " " + m)
        : "Unassigned"}
    </button>
  );
}

export default function KeyOption({
  label,
  value,
  requiresReload,
  onChange,
  hover,
}: KeyOptionProps) {
  const change = (newValue: string | null, index: number) => {
    value[index] = newValue;
    onChange(value);
  };

  return (
    <li className={styles.container}>
      <span className={styles.label}>
        {label}
        {requiresReload && <span className={styles.requiresReload}> *</span>}
      </span>
      <div className={styles.controls}>
        {value.map((key, i) => (
          <Key
            key={label + i}
            value={key}
            setValue={(newValue) => change(newValue, i)}
            hover={hover}
          />
        ))}
      </div>
    </li>
  );
}
