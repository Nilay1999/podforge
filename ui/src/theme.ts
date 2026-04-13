import {
  createTheme,
  MantineColorsTuple,
  DEFAULT_THEME,
  mergeMantineTheme,
} from "@mantine/core";

// Cyan — primary brand color
const cyan: MantineColorsTuple = [
  "#ecfeff",
  "#cffafe",
  "#a5f3fc",
  "#67e8f9",
  "#22d3ee",
  "#06b6d4", // [5] — base cyan
  "#0891b2",
  "#0e7490",
  "#155e75",
  "#164e63",
];

// Sky accent for secondary actions
const sky: MantineColorsTuple = [
  "#f0f9ff",
  "#e0f2fe",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9", // [5]
  "#0284c7",
  "#0369a1",
  "#075985",
  "#0c4a6e",
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
  primaryColor: "cyan",
  colors: {
    cyan,
    sky,
    success,
    warning,
    danger,
    // Softened dark backgrounds using Zinc scale
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
