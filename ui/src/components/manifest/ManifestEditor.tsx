import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { useMantineColorScheme } from "@mantine/core";
import { appEditorThemeDark, appEditorThemeLight } from "./editorTheme";

interface ManifestEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ManifestEditor({ value, onChange }: ManifestEditorProps) {
  const { colorScheme } = useMantineColorScheme();
  const editorTheme = colorScheme === "dark" ? appEditorThemeDark : appEditorThemeLight;

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={editorTheme}
      extensions={[yaml()]}
      onChange={onChange}
      style={{ height: "100%", fontSize: 13 }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        autocompletion: true,
        highlightActiveLine: true
      }}
    />
  );
}
