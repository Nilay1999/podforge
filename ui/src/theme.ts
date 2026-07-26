import type { CSSVariablesResolver, MantineColorsTuple } from "@mantine/core";
import { createTheme, DEFAULT_THEME, mergeMantineTheme } from "@mantine/core";

/*
 * Semantic palettes. Mantine derives every per-scheme variant color from fixed
 * indices (see get-css-color-variables.mjs), keyed off primaryShade — which is
 * { light: 6, dark: 5 } below. That makes these the contrast anchors:
 *
 *   DARK scheme                        LIGHT scheme
 *   [3] `light` variant bg (15% alpha) [6] `light` variant bg (10% alpha)
 *   [4] `light` text, `outline`,       [6] `light` text, `outline`,
 *       `{c}-text`                         `{c}-text`
 *   [5] `filled` bg                    [6] `filled` bg
 *
 * Stock Mantine would take dark-scheme `light` text from [0] and `outline`
 * from [1] — near-white pastels that technically pass contrast but render the
 * badge colorless and washed out. cssVariablesResolver below redirects both to
 * [4], which keeps the hue saturated and still clears AA on dark surfaces.
 *
 * So [4] must be legible on #27272a, and [6] must clear 4.5:1 against white
 * both as ink and as a background behind white text. The large 5→6 step is
 * intentional: dark wants a vivid chip, light wants a dark ink.
 */

// Steel Blue — primary brand color (desaturated, calm on dark backgrounds)
const steelBlue: MantineColorsTuple = [
  "#eaf1ff", // [0] — dark-scheme `light` text
  "#d3e2ff", // [1] — dark-scheme `outline`
  "#b6cbf9",
  "#8dadf5", // [3] — dark-scheme `light` bg tint
  "#6892ee", // [4] — 5.9:1 on dark surface
  "#3d6ddd", // [5] — 4.7:1 behind white text
  "#2f5cc4", // [6] — 6.0:1 on white
  "#274ea6",
  "#1f3f87",
  "#17306a"
];

// Slate accent for secondary actions
const slate: MantineColorsTuple = [
  "#f1f5fd",
  "#e2eafb",
  "#c2d3f7",
  "#a0bbf3", // [3]
  "#7a9ced",
  "#4a72d9", // [5]
  "#3a5cb8", // [6]
  "#2e4a97",
  "#243a78",
  "#1a2b5a"
];

// Violet accent — non-status emphasis (elevated roles) that must not be
// mistaken for a warning or an error
const accent: MantineColorsTuple = [
  "#f3eeff", // [0] — dark-scheme `light` text
  "#e3d8ff", // [1] — dark-scheme `outline`
  "#d7cbfd",
  "#c4b0fb", // [3] — dark-scheme `light` bg tint
  "#9b7cf0", // [4] — 6.4:1 on dark surface
  "#7c4ddb", // [5] — 5.3:1 behind white text
  "#6d28d9", // [6] — 7.1:1 on white
  "#5b21b6",
  "#4a1a95",
  "#3a1476"
];

// Green for success / running states
const success: MantineColorsTuple = [
  "#e3fded", // [0] — dark-scheme `light` text
  "#c3f7d8", // [1] — dark-scheme `outline`
  "#a7f0c2",
  "#74e3a1", // [3] — dark-scheme `light` bg tint
  "#45d183", // [4] — 7.7:1 on dark surface
  "#22c55e", // [5] — autoContrast pairs this with dark text
  "#15803d", // [6] — 5.0:1 on white
  "#116932",
  "#0e5228",
  "#0a3a1d"
];

// Amber for warning / pending states
const warning: MantineColorsTuple = [
  "#fff4d6", // [0] — dark-scheme `light` text
  "#ffe7ad", // [1] — dark-scheme `outline`
  "#fadf9b",
  "#f7ca63", // [3] — dark-scheme `light` bg tint
  "#f4b736", // [4] — 8.4:1 on dark surface
  "#f2a41a", // [5] — autoContrast pairs this with dark text
  "#b45309", // [6] — 5.0:1 on white
  "#93430a",
  "#78350f",
  "#5a2708"
];

// Red for error / failed states
const danger: MantineColorsTuple = [
  "#ffeded", // [0] — dark-scheme `light` text
  "#ffd7d7", // [1] — dark-scheme `outline`
  "#fecaca",
  "#fca5a5", // [3] — dark-scheme `light` bg tint
  "#f87171", // [4] — 6.6:1 on dark surface
  "#e03131", // [5] — 4.5:1 behind white text
  "#dc2626", // [6] — 4.8:1 on white
  "#b91c1c",
  "#991b1b",
  "#7f1d1d"
];

const themeOverride = createTheme({
  primaryColor: "steelBlue",
  colors: {
    steelBlue,
    slate,
    accent,
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
  // Flip foreground to black on bright fills (warning/success) instead of
  // leaving unreadable white-on-amber. Threshold is Mantine's default.
  autoContrast: true,
  luminanceThreshold: 0.3,
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
    Alert: {
      defaultProps: { radius: "md", variant: "light" }
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

/*
 * On dark backgrounds Mantine derives `light`-variant text from shade 0 and
 * `outline` from shade 1 — both near-white, so a "Warning" chip ends up the
 * same washed-out off-white as everything else. Redirect both to shade 4,
 * which is the saturated step that still clears AA on #27272a.
 */
export const cssVariablesResolver: CSSVariablesResolver = (t) => {
  const dark: Record<string, string> = {};

  Object.keys(t.colors).forEach((name) => {
    if (name === "dark") return;
    // gray is the neutral "nothing to see here" chip (Normal events, empty
    // states). Held one step darker so it recedes and the status colors carry
    // the eye; shade 4 would put it at almost the same brightness as a warning.
    const shade = name === "gray" ? 5 : 4;
    dark[`--mantine-color-${name}-light-color`] = `var(--mantine-color-${name}-${shade})`;
    dark[`--mantine-color-${name}-outline`] = `var(--mantine-color-${name}-${shade})`;
  });

  return { variables: {}, light: {}, dark };
};
