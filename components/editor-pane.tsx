"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";

import { getLanguageExtension } from "@/lib/codemirror-lang";
import { useTheme } from "@/components/theme-provider";

type EditorPaneProps = {
  label: string;
  language?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
};

const lightTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    backgroundColor: "transparent",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "none",
    color: "oklch(0.55 0.04 257)",
  },
  ".cm-content": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  ".cm-activeLine": {
    backgroundColor: "oklch(0.93 0.01 255 / 0.5)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
});

const darkTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    backgroundColor: "transparent",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "none",
    color: "oklch(0.5 0.03 265)",
  },
  ".cm-content": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  ".cm-activeLine": {
    backgroundColor: "oklch(0.22 0.03 265 / 0.6)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
});

export function EditorPane({ label, language, value, onChange, readOnly, placeholder }: EditorPaneProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const extensions = useMemo(() => {
    const ext = [isDark ? darkTheme : lightTheme];
    if (isDark) ext.push(oneDark);
    if (language) {
      const langExt = getLanguageExtension(language);
      if (langExt) ext.push(langExt);
    }
    return ext;
  }, [language, isDark]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col rounded-2xl border border-border/70 bg-card/80 shadow-sm backdrop-blur">
      <div className="border-b border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="min-h-[320px] flex-1 overflow-auto rounded-b-2xl bg-background/65">
        <CodeMirror
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            searchKeymap: false,
          }}
          extensions={extensions}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          theme={isDark ? "dark" : "light"}
          value={value}
        />
      </div>
    </div>
  );
}
