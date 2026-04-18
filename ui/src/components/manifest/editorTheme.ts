import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

export const appEditorTheme = createTheme({
  theme: "dark",
  settings: {
    background: "#1e1e22",
    backgroundImage: "none",
    foreground: "#D4D4D8",
    caret: "white",
    selection: "#5b8def33",
    selectionMatch: "#5b8def22",
    lineHighlight: "#27272a",
    gutterBackground: "#18181b",
    gutterForeground: "#71717A",
    gutterBorder: "#3f3f46",
  },
  styles: [
    { tag: t.propertyName, color: "#60a5fa", fontWeight: "600" },
    { tag: t.string, color: "#22c55e" },
    { tag: t.number, color: "#f59e0b" },
    { tag: t.bool, color: "#5b8def" },
    { tag: t.null, color: "#A1A1AA" },
    { tag: t.bracket, color: "#D4D4D8" },
    { tag: t.punctuation, color: "#71717A" },
    { tag: t.keyword, color: "#5b8def" },
    { tag: t.operator, color: "#6389e6" },
    { tag: t.comment, color: "#71717A", fontStyle: "italic" },
    { tag: t.invalid, color: "#ef4444" },
  ],
});
