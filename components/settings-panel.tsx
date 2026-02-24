import type { ConverterDefinition, ConverterSettings } from "@/lib/converters/types";

type SettingsPanelProps = {
  converter: ConverterDefinition;
  settings: ConverterSettings;
  onChange: (key: string, value: string | boolean) => void;
};

export function SettingsPanel({ converter, settings, onChange }: SettingsPanelProps) {
  if (!converter.settings?.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {converter.settings.map((setting) => (
        <div className="flex items-center justify-between gap-4 border border-border bg-card px-3 py-2" key={setting.key}>
          <label className="text-sm font-medium" htmlFor={setting.key}>
            {setting.label}
          </label>
          {setting.type === "boolean" ? (
            <input
              checked={Boolean(settings[setting.key])}
              className="h-4 w-4 accent-primary"
              id={setting.key}
              onChange={(event) => onChange(setting.key, event.target.checked)}
              type="checkbox"
            />
          ) : setting.type === "select" ? (
            <select
              className="border border-border bg-background px-2 py-1 text-sm"
              id={setting.key}
              onChange={(event) => onChange(setting.key, event.target.value)}
              value={String(settings[setting.key] ?? setting.defaultValue)}
            >
              {setting.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="border border-border bg-background px-2 py-1 text-sm"
              id={setting.key}
              onChange={(event) => onChange(setting.key, event.target.value)}
              type="text"
              value={String(settings[setting.key] ?? "")}
            />
          )}
        </div>
      ))}
    </div>
  );
}
