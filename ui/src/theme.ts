import {
  createTheme,
  MantineColorsTuple,
  DEFAULT_THEME,
  mergeMantineTheme,
} from "@mantine/core";

// Steel Blue — primary brand color (desaturated, calm on dark backgrounds)
const steelBlue: MantineColorsTuple = [
  "#eff4fe",
  "#dce8fd",
  "#b5cefb",
  "#89b2f8",
  "#6b9bf5",
  "#5b8def", // [5] — base steel blue
  "#4a7de8",
  "#3a6dd8",
  "#2d5dbf",
  "#1e4aa3",
];

// Slate accent for secondary actions
const slate: MantineColorsTuple = [
  "#f1f5fd",
  "#e2eafb",
  "#c2d3f7",
  "#99b5f2",
  "#7a9ced",
  "#6389e6", // [5]
  "#4f75d8",
  "#3d61c6",
  "#2e4fa8",
  "#1f3a88",
];

// Green for success / running states
const success: MantineColorsTuple = [
  "#f0fdf4",
  "#dcfce7",
  "#bbf7d0",
  "#86efac",
  "#4ade80",
  "#22c55e", // [5]
  "#16a34a",
  "#15803d",
  "#166534",
  "#14532d",
];

// Amber for warning / pending states
const warning: MantineColorsTuple = [
  "#fffbeb",
  "#fef3c7",
  "#fde68a",
  "#fcd34d",
  "#fbbf24",
  "#f59e0b", // [5]
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
];

// Red for error / failed states
const danger: MantineColorsTuple = [
  "#fef2f2",
  "#fee2e2",
  "#fecaca",
  "#fca5a5",
  "#f87171",
  "#ef4444", // [5]
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#7f1d1d",
];

const themeOverride = createTheme({
  primaryColor: "steelBlue",
  colors: {
    steelBlue,
    slate,
    success,
    warning,
    danger,
    dark: [
      "#FAFAFA", // [0] text on dark bg
      "#D4D4D8", // [1] secondary text
      "#A1A1AA", // [2] dimmed text
      "#71717A", // [3] muted text
      "#3f3f46", // [4] borders
      "#27272a", // [5] surface/card bg
      "#1e1e22", // [6] navbar/sidebar bg
      "#141416", // [7] body bg
      "#0f0f11", // [8] deepest bg
      "#09090b", // [9]
    ],
  },
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  },
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: "md",
  cursorType: "pointer",
});

export const theme = mergeMantineTheme(DEFAULT_THEME, themeOverride);
