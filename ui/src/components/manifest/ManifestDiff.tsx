import { useEffect, useRef } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { MergeView } from "@codemirror/merge";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { yaml } from "@codemirror/lang-yaml";
import { appEditorThemeDark, appEditorThemeLight } from "./editorTheme";

interface ManifestDiffProps {
  original: string;
  modified: string;
}

export function ManifestDiff({ original, modified }: ManifestDiffProps) {
  const { colorScheme } = useMantineColorScheme();
  const editorTheme = colorScheme === "dark" ? appEditorThemeDark : appEditorThemeLight;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const common = [lineNumbers(), yaml(), editorTheme, EditorView.lineWrapping, EditorState.readOnly.of(true)];
    const view = new MergeView({
      a: { doc: original, extensions: common },
      b: { doc: modified, extensions: common },
      parent: containerRef.current,
      highlightChanges: true,
      gutter: true,
      collapseUnchanged: { margin: 3, minSize: 4 }
    });
    return () => view.destroy();
  }, [original, modified, editorTheme]);

  return <div ref={containerRef} style={{ height: "100%", overflow: "auto", fontSize: 13 }} />;
}
