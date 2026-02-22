type EditorPaneProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
};

export function EditorPane({ label, value, onChange, readOnly, placeholder }: EditorPaneProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col rounded-2xl border border-border/70 bg-card/80 shadow-sm backdrop-blur">
      <div className="border-b border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <textarea
        className="h-full min-h-[320px] w-full flex-1 resize-none rounded-b-2xl bg-background/65 p-3 font-mono text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        value={value}
      />
    </div>
  );
}
