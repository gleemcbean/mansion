import type { BooleanOptionProps } from "@/ui/components/BooleanOption";
import type { KeyOptionProps } from "@/ui/components/KeyOption";
import type { SliderOptionProps } from "@/ui/components/SliderOption";

export const DEFAULT_OPTIONS = {
  // GRAPHICS
  dpr: 0.35,
  shadows: true,
  particles: true,
  bloom: true,
  noise: true,
  chromaticAberration: true,
  hud: true,

  // AUDIO
  muted: false,
  volume: 50,

  // CONTROLS
  sensitivity: 50,
  damping: 50,
  invertY: false,
  forward: ["KeyW", null],
  backward: ["KeyS", null],
  left: ["KeyA", null],
  right: ["KeyD", null],
  up: ["Space", null],
  sprint: ["ShiftLeft", null],
  crouch: ["ControlLeft", null],
  light: ["KeyF", null],

  // DEV
  showHelper: false,
  doPostProcessing: true,
  fly: false,
  noClip: false,
  stats: false,
  godMode: false,
  speed: 1,
};

export type Options = typeof DEFAULT_OPTIONS;

export enum OptionCategory {
  Graphics = "Graphics",
  Audio = "Audio",
  Controls = "Controls",
  Dev = "Dev",
}

export enum OptionType {
  Boolean,
  Number,
  Keybind,
}

type OptionProps<T> = Omit<T, "value" | "onChange">;

type OptionComponent =
  | ({
      id: keyof Options;
      separator?: false;
    } & (
      | ({ type: OptionType.Boolean } & OptionProps<BooleanOptionProps>)
      | ({ type: OptionType.Number } & OptionProps<SliderOptionProps>)
      | ({ type: OptionType.Keybind } & OptionProps<KeyOptionProps>)
    ))
  | { separator: true; label: string };

export const OPTIONS_COMPONENTS = Object.freeze({
  [OptionCategory.Graphics]: [
    {
      id: "dpr",
      type: OptionType.Number,
      label: "Display Resolution",
      requiresReload: true,
      min: 0.1,
      max: 0.4,
      step: 0.05,
    },
    {
      id: "shadows",
      type: OptionType.Boolean,
      label: "Shadows",
      requiresReload: true,
    },
    {
      id: "particles",
      type: OptionType.Boolean,
      label: "Particles",
    },
    {
      id: "bloom",
      type: OptionType.Boolean,
      label: "Bloom",
    },
    {
      id: "chromaticAberration",
      type: OptionType.Boolean,
      label: "Chromatic Aberration",
    },
    {
      id: "hud",
      type: OptionType.Boolean,
      label: "HUD",
    },
  ],
  [OptionCategory.Audio]: [
    {
      id: "muted",
      type: OptionType.Boolean,
      label: "Muted",
    },
    {
      id: "volume",
      type: OptionType.Number,
      label: "Volume",
      max: 100,
      min: 0,
      step: 5,
      valueFormat: (v: number) => `${v}%`,
    },
  ],
  [OptionCategory.Controls]: [
    {
      id: "sensitivity",
      type: OptionType.Number,
      label: "Sensitivity",
      max: 100,
      min: 10,
      step: 5,
    },
    {
      id: "damping",
      type: OptionType.Number,
      label: "Damping",
      max: 100,
      min: 10,
      step: 5,
    },
    {
      id: "invertY",
      type: OptionType.Boolean,
      label: "Invert Y-Axis",
    },
    {
      separator: true,
      label: "Keybinds",
    },
    {
      id: "forward",
      type: OptionType.Keybind,
      label: "Forward",
    },
    {
      id: "backward",
      type: OptionType.Keybind,
      label: "Backward",
    },
    {
      id: "left",
      type: OptionType.Keybind,
      label: "Left",
    },
    {
      id: "right",
      type: OptionType.Keybind,
      label: "Right",
    },
    {
      id: "up",
      type: OptionType.Keybind,
      label: "Jump",
    },
    {
      id: "sprint",
      type: OptionType.Keybind,
      label: "Sprint",
    },
    {
      id: "crouch",
      type: OptionType.Keybind,
      label: "Crouch",
    },
    {
      id: "light",
      type: OptionType.Keybind,
      label: "Flashlight",
    },
  ],
  [OptionCategory.Dev]: [
    {
      id: "showHelper",
      type: OptionType.Boolean,
      label: "Show Helpers",
    },
    {
      id: "doPostProcessing",
      type: OptionType.Boolean,
      label: "Post Processing",
    },
    {
      id: "fly",
      type: OptionType.Boolean,
      label: "Fly",
    },
    {
      id: "noClip",
      type: OptionType.Boolean,
      label: "No Clip",
    },
    {
      id: "stats",
      type: OptionType.Boolean,
      label: "Show Stats",
    },
    {
      id: "godMode",
      type: OptionType.Boolean,
      label: "God Mode",
    },
    {
      id: "speed",
      type: OptionType.Number,
      label: "Speed",
      max: 2,
      min: 0.01,
      step: 0.01,
    },
  ],
}) as Readonly<Record<OptionCategory, OptionComponent[]>>;
