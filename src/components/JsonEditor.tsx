import { parseColor, rgbaToHex } from "@/lib/color";
import Editor from "@monaco-editor/react";
import { useRef } from "react";
import jsonSchema from "../schema.json";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: "vs" | "vs-dark";
  height?: string;
  className?: string;
  readonly?: boolean;
  onSave?: () => void;
}

export function JsonEditor({
  value,
  onChange,
  theme,
  height = "calc(100vh - 300px)",
  className = "",
  readonly = false,
  onSave,
}: JsonEditorProps) {
  const monacoInitializedRef = useRef(false);

  return (
    <div
      className={`${className} ${height === "100%" ? "flex-1" : ""} relative`}
    >
      <Editor
        theme={theme}
        beforeMount={(monaco) => {
          // Only initialize Monaco once to prevent duplicate color providers
          if (monacoInitializedRef.current) {
            return;
          }
          monacoInitializedRef.current = true;

          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
              {
                uri: "http://myserver/my-schema.json",
                fileMatch: ["*"],
                schema: jsonSchema,
              },
            ],
          });
          monaco.languages.json.jsonDefaults.setModeConfiguration({
            documentFormattingEdits: true,
            documentRangeFormattingEdits: true,
            completionItems: true,
            hovers: true,
            documentSymbols: true,
            tokens: true,
            colors: true, // Enable color picker
            foldingRanges: true,
            diagnostics: true,
            selectionRanges: true,
          });
          // Only register color provider once to prevent duplicates on navigation
          if (
            !(
              window as unknown as {
                __jsonColorProviderRegistered?: boolean;
              }
            ).__jsonColorProviderRegistered
          ) {
            monaco.languages.registerColorProvider("json", {
              provideDocumentColors(model) {
                const colors: {
                  color: {
                    red: number;
                    green: number;
                    blue: number;
                    alpha: number;
                  };
                  range: {
                    startLineNumber: number;
                    startColumn: number;
                    endLineNumber: number;
                    endColumn: number;
                  };
                }[] = [];
                const text = model.getValue();

                // Match quoted strings that could be colors (hex, rgb, rgba, hsl, hsla, or named colors)
                // This regex matches any quoted string, then we'll validate with parseColor
                const colorRegex = /"([^"]+)"/g;
                let match;

                while ((match = colorRegex.exec(text)) !== null) {
                  const colorString = match[1];

                  // Skip obviously non-color strings to improve performance
                  // Only check strings that could plausibly be colors
                  if (
                    colorString.length > 50 ||
                    (colorString.includes(" ") &&
                      !colorString.match(/^(rgb|hsl)/i)) ||
                    colorString.includes("/") ||
                    colorString.includes("\\")
                  ) {
                    continue;
                  }

                  const startPos = model.getPositionAt(match.index + 1); // +1 to skip opening quote
                  const endPos = model.getPositionAt(
                    match.index + match[1].length + 1
                  );

                  // Use our robust parseColor function to validate and parse
                  const color = parseColor(colorString);
                  if (color) {
                    colors.push({
                      color: color,
                      range: {
                        startLineNumber: startPos.lineNumber,
                        startColumn: startPos.column,
                        endLineNumber: endPos.lineNumber,
                        endColumn: endPos.column,
                      },
                    });
                  }
                }

                return colors;
              },
              provideColorPresentations(_, colorInfo) {
                const color = colorInfo.color;
                const hex = rgbaToHex(color);
                const rgb = `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, ${color.alpha})`;

                return [
                  {
                    label: hex,
                    textEdit: {
                      range: colorInfo.range,
                      text: hex,
                    },
                  },
                  {
                    label: rgb,
                    textEdit: {
                      range: colorInfo.range,
                      text: rgb,
                    },
                  },
                ];
              },
            });
            (
              window as unknown as {
                __jsonColorProviderRegistered?: boolean;
              }
            ).__jsonColorProviderRegistered = true;
          }
        }}
        onMount={(editor, monaco) => {
          // Add custom command for Alt/Command+S to save
          if (onSave) {
            // Alt+S (Windows/Linux) and Command+S (Mac)
            // We'll handle both Alt+S and Command+S
            // Alt+S binding
            editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () => {
              onSave();
            });
            // Command+S (Mac) - KeyMod.CtrlCmd is Command on Mac, Ctrl on Windows
            // We need to check if we're on Mac to avoid overriding Ctrl+S on Windows
            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            if (isMac) {
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                () => {
                  onSave();
                }
              );
            }
          }
        }}
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={(value) => onChange(value || "")}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          fontFamily:
            "Monaco, Menlo, Ubuntu Mono, Consolas, source-code-pro, monospace",
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          bracketPairColorization: { enabled: true },
          folding: true,
          lineNumbers: "on",
          renderWhitespace: "selection",
          selectOnLineNumbers: true,
          roundedSelection: true,
          cursorStyle: "line",
          contextmenu: true,
          mouseWheelZoom: true,
          smoothScrolling: true,
          readOnly: readonly,
        }}
        loading={
          <div className="flex items-center justify-center h-32">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
