import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseColor, rgbaToHex } from "@/lib/color";
import Editor from "@monaco-editor/react";
import { CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { useMemo, useRef } from "react";
import jsonSchema from "../schema.json";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: "vs" | "vs-dark";
  height?: string;
  className?: string;
  isValid?: boolean;
  validationError?: string | null;
  readonly?: boolean;
  onSave?: () => void;
}

export function JsonEditor({
  value,
  onChange,
  theme,
  height = "calc(100vh - 300px)",
  className = "",
  isValid: isValidProp,
  validationError,
  readonly = false,
  onSave,
}: JsonEditorProps) {
  const monacoInitializedRef = useRef(false);

  // Determine if theme is valid - isValid prop takes precedence
  const isValid =
    isValidProp !== undefined ? isValidProp : validationError === null;

  // Check if backgroundImage exists and is not a URL
  const backgroundImageWarning = useMemo(() => {
    try {
      const parsedTheme = JSON.parse(value);
      const themeWithBackground = parsedTheme as typeof parsedTheme & {
        backgroundImage?: string;
      };
      if (themeWithBackground.backgroundImage) {
        const bgImage = themeWithBackground.backgroundImage;
        // Check if it's a URL
        const isUrl = (() => {
          try {
            new URL(bgImage);
            return true;
          } catch {
            return /^(https?|data|blob):/i.test(bgImage);
          }
        })();
        if (!isUrl) {
          return "Local background image files are not supported. Please upload the background image file in the theme editor.";
        }
      }
    } catch {
      // If JSON is invalid, we can't check backgroundImage
    }
    return null;
  }, [value]);

  // Determine what to show: isValid takes precedence always
  // If isValid is false -> show error (red)
  // If isValid is true AND (validationError exists OR backgroundImage isn't URL) -> show warning (yellow)
  // Otherwise -> show success (green)
  const showError = isValid === false && validationError;
  const showWarning =
    isValid === true && (validationError || backgroundImageWarning);

  const warningMessage = validationError || backgroundImageWarning;
  const hasValidation = showError || showWarning || isValid === true;

  return (
    <div
      className={`${className} ${height === "100%" ? "flex-1" : ""} relative`}
    >
      {hasValidation && (
        <div className="absolute top-2 right-2 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  {showError && <XCircle className="w-5 h-5 text-red-500" />}
                  {showWarning && !showError && (
                    <TriangleAlert className="w-5 h-5 text-yellow-500" />
                  )}
                  {!showError && !showWarning && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </TooltipTrigger>
              {showError && validationError && (
                <TooltipContent>
                  <p className="max-w-xs">{validationError}</p>
                </TooltipContent>
              )}
              {showWarning && !showError && warningMessage && (
                <TooltipContent>
                  <p className="max-w-xs">{warningMessage}</p>
                </TooltipContent>
              )}
              {!showError && !showWarning && (
                <TooltipContent>
                  <p>Theme JSON is valid</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
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
