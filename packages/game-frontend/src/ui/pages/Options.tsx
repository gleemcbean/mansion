import {
  OptionCategory,
  OPTIONS_COMPONENTS,
  OptionType,
} from "@/constants/Options";
import Container from "../components/Container";
import styles from "../styles/modules/pages/Options.module.scss";
import { useCallback, useEffect, useState } from "react";
import BooleanOption from "../components/BooleanOption";
import useClient from "@/hooks/useClient";
import SliderOption from "../components/SliderOption";
import KeyOption from "../components/KeyOption";

type HoverShape = {
  top: string;
  left: string;
  width: string;
  height: string;
} | null;

export type ComponentProps = {
  label: string;
  requiresReload?: boolean;
  hover: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

type OptionsProps = {
  back: () => void;
};

const HOVER_SHAPE_PADDING = 8;

export default function Options({ back }: OptionsProps) {
  const { options, setOption } = useClient();
  const [selected, setSelected] = useState(0);
  const [hoverShape, setHoverShape] = useState<HoverShape>(null);

  const hover = useCallback((e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const bounds = e.currentTarget.getBoundingClientRect();

    setHoverShape({
      top: `${bounds.top - HOVER_SHAPE_PADDING}px`,
      left: `${bounds.left - HOVER_SHAPE_PADDING}px`,
      width: `${bounds.width + HOVER_SHAPE_PADDING * 2}px`,
      height: `${bounds.height + HOVER_SHAPE_PADDING * 2}px`,
    });
  }, []);

  useEffect(() => {
    return () => setHoverShape(null);
  }, []);

  return (
    <Container horizontal>
      <div className={styles.sidebar}>
        <h1 className={styles.title}>Options</h1>
        <ul className={styles.categories}>
          <span
            className={styles.selectedIndicator}
            style={{ top: `${selected * 80}px` }}
          />
          {Object.values(OptionCategory).map((category, index) => (
            <li
              key={category}
              className={`${styles.category}${
                index === selected ? ` ${styles.selected}` : ""
              }`}
              onClick={() => setSelected(index)}
              onMouseEnter={hover}
            >
              {category}
            </li>
          ))}
          <li className={styles.category} onClick={back} onMouseEnter={hover}>
            Back
          </li>
        </ul>
      </div>
      <ul className={styles.options}>
        {OPTIONS_COMPONENTS[Object.values(OptionCategory)[selected]].map(
          (component, index) => {
            if (component.separator) {
              return (
                <h3 key={index} className={styles.separator}>
                  {component.label}
                </h3>
              );
            }

            switch (component.type) {
              case OptionType.Boolean:
                return (
                  <BooleanOption
                    key={component.id}
                    {...component}
                    hover={hover}
                    onChange={(value) => setOption(component.id, value)}
                    value={options[component.id] as boolean}
                  />
                );

              case OptionType.Number:
                return (
                  <SliderOption
                    key={component.id}
                    {...component}
                    hover={hover}
                    onChange={(value) => setOption(component.id, value)}
                    value={options[component.id] as number}
                  />
                );

              case OptionType.Keybind:
                return (
                  <KeyOption
                    key={component.id}
                    {...component}
                    hover={hover}
                    onChange={(value) => setOption(component.id, value)}
                    value={
                      options[component.id] as [string | null, string | null]
                    }
                  />
                );
            }
          }
        )}
      </ul>
      {hoverShape && (
        <div className={styles.hoverIndicator} style={hoverShape} />
      )}
    </Container>
  );
}
