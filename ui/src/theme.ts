import type { MantineColorsTuple } from "@mantine/core";
import { createTheme, DEFAULT_THEME, mergeMantineTheme } from "@mantine/core";

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
  "#1e4aa3"
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
  "#1f3a88"
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
  "#14532d"
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
  "#78350f"
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
  "#7f1d1d"
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
      "#FAFAFA", // [0] fg-default
      "#D4D4D8", // [1] secondary text
      "#A1A1AA", // [2] fg-dimmed
      "#71717A", // [3] muted text
      "#3f3f46", // [4] border-default
      "#1e1e22", // [5] bg-navbar
      "#27272a", // [6] bg-surface — Paper/Card use this index
      "#141416", // [7] bg-body
      "#0f0f11", // [8] deepest bg
      "#09090b" // [9]
    ]
  },
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
  },
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    Paper: {
      defaultProps: { radius: "lg" }
    },
    Card: {
      defaultProps: { radius: "lg" }
    },
    Button: {
      defaultProps: { radius: "md" },
      styles: { root: { fontWeight: 600 } }
    },
    ActionIcon: {
      defaultProps: { radius: "md" }
    },
    Badge: {
      defaultProps: { radius: "sm" },
      styles: { root: { fontWeight: 600, letterSpacing: "0.01em" } }
    },
    TextInput: {
      defaultProps: { radius: "md" }
    },
    PasswordInput: {
      defaultProps: { radius: "md" }
    },
    Select: {
      defaultProps: { radius: "md" }
    },
    NavLink: {
      defaultProps: { radius: "md" }
    },
    Menu: {
      defaultProps: { radius: "md", shadow: "md" }
    },
    Tooltip: {
      defaultProps: { radius: "md", withArrow: true },
      styles: { tooltip: { fontSize: "12px" } }
    },
    Table: {
      defaultProps: { verticalSpacing: "sm", horizontalSpacing: "md" }
    },
    ThemeIcon: {
      defaultProps: { radius: "md" }
    },
    Drawer: {
      defaultProps: { radius: 0 }
    }
  }
});

export const theme = mergeMantineTheme(DEFAULT_THEME, themeOverride);
