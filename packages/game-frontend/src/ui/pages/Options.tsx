import {
  OptionCategory,
  OPTIONS_COMPONENTS,
  OptionType,
} from "@/constants/Options";
import Container from "../components/Container";
import styles from "../styles/modules/pages/Options.module.scss";
import { useCallback, useRef, useState } from "react";
import BooleanOption from "../components/BooleanOption";
import useClient from "@/hooks/useClient";
import SliderOption from "../components/SliderOption";
import KeyOption from "../components/KeyOption";

type HoverShape = {
  top: number;
  left: number;
  width: number;
  height: number;
  element: EventTarget;
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
const SCROLL_STEP = 150;
const SCROLL_DURATION = 200;

export default function Options({ back }: OptionsProps) {
  const { options, setOption } = useClient();
  const [selected, setSelected] = useState(0);
  const [hoverShape, setHoverShape] = useState<HoverShape>(null);
  const [scroll, setScroll] = useState(0);
  const hoverable = useRef(true);
  const timeout = useRef<NodeJS.Timeout>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const hover = useCallback((e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!hoverable.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();

    setHoverShape({
      top: bounds.top - HOVER_SHAPE_PADDING,
      left: bounds.left - HOVER_SHAPE_PADDING,
      width: bounds.width + HOVER_SHAPE_PADDING * 2,
      height: bounds.height + HOVER_SHAPE_PADDING * 2,
      element: e.target,
    });
  }, []);

  const scrollContainer = (e: React.WheelEvent<HTMLElement>) => {
    if (!sidebarRef.current || !scrollerRef.current) return;

    if (timeout.current) clearTimeout(timeout.current);
    hoverable.current = false;

    const sidebarHeight = sidebarRef.current.getBoundingClientRect().height;
    const scrollHeight = scrollerRef.current.getBoundingClientRect().height;

    const oldScroll = scroll;
    let newScroll = scroll - SCROLL_STEP * Math.sign(e.deltaY);
    newScroll = Math.max(newScroll, sidebarHeight - scrollHeight);
    newScroll = Math.min(0, newScroll);
    const step = oldScroll - newScroll;

    setScroll(newScroll);

    setHoverShape((prev) => {
      if (
        prev?.element &&
        scrollerRef.current!.contains(prev.element as HTMLElement)
      ) {
        return { ...prev!, top: prev!.top - step };
      }

      return prev;
    });

    timeout.current = setTimeout(
      () => (hoverable.current = true),
      SCROLL_DURATION
    );
  };

  return (
    <Container horizontal onWheel={scrollContainer}>
      <div className={styles.sidebar} ref={sidebarRef}>
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
              onClick={() => {
                setSelected(index);
                setScroll(0);
              }}
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
      <ul
        className={styles.options}
        style={{
          transform: `translateY(${scroll}px)`,
          transition: `${SCROLL_DURATION}ms ease`,
        }}
        ref={scrollerRef}
      >
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
