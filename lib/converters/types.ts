export type ConverterCategory =
  | "SVG"
  | "HTML"
  | "JSON"
  | "JSON Schema"
  | "Programming Languages"
  | "CSS"
  | "JavaScript"
  | "GraphQL"
  | "JSON-LD"
  | "TypeScript"
  | "Flow"
  | "Others";

export type ConverterSettingType = "boolean" | "select" | "text";

export type ConverterSetting = {
  key: string;
  label: string;
  type: ConverterSettingType;
  defaultValue: boolean | string;
  options?: Array<{ label: string; value: string }>;
};

export type ConverterDefinition = {
  slug: string;
  title: string;
  sourceLabel: string;
  targetLabel: string;
  category: ConverterCategory;
  settings?: ConverterSetting[];
  inputPlaceholder?: string;
};

export type ConverterSettings = Record<string, boolean | string>;
