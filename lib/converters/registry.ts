import type { ConverterCategory, ConverterDefinition, ConverterSettings } from "@/lib/converters/types";

const byCategory: Record<ConverterCategory, ConverterDefinition[]> = {
  SVG: [
    {
      slug: "svg-to-jsx",
      title: "SVG to JSX",
      sourceLabel: "SVG",
      targetLabel: "JSX",
      category: "SVG",
      settings: [{ key: "svgo", label: "SVGO optimization", type: "boolean", defaultValue: true }],
    },
  ],
  HTML: [
    { slug: "html-to-jsx", title: "HTML to JSX", sourceLabel: "HTML", targetLabel: "JSX", category: "HTML" },
  ],
  JSON: [
    { slug: "json-to-typescript", title: "JSON to TypeScript", sourceLabel: "JSON", targetLabel: "TypeScript", category: "JSON" },
    { slug: "json-to-yaml", title: "JSON to YAML", sourceLabel: "JSON", targetLabel: "YAML", category: "JSON" },
    {
      slug: "json-prettify",
      title: "JSON Prettify / Minify",
      sourceLabel: "JSON",
      targetLabel: "JSON",
      category: "JSON",
      settings: [{ key: "minify", label: "Minify output", type: "boolean", defaultValue: false }],
    },
    { slug: "json-to-zod", title: "JSON to Zod Schema", sourceLabel: "JSON", targetLabel: "Zod", category: "JSON" },
  ],
  "JSON Schema": [
    { slug: "json-schema-to-typescript", title: "JSON Schema to TypeScript", sourceLabel: "JSON Schema", targetLabel: "TypeScript", category: "JSON Schema" },
  ],
  "Programming Languages": [
    {
      slug: "python-to-javascript",
      title: "Python to JavaScript",
      sourceLabel: "Python",
      targetLabel: "JavaScript",
      category: "Programming Languages",
    },
    {
      slug: "javascript-to-python",
      title: "JavaScript to Python",
      sourceLabel: "JavaScript",
      targetLabel: "Python",
      category: "Programming Languages",
    },
  ],
  CSS: [],
  JavaScript: [],
  GraphQL: [],
  "JSON-LD": [],
  TypeScript: [],
  Flow: [],
  Utilities: [
    { slug: "base64-encode", title: "Base64 Encode", sourceLabel: "Text", targetLabel: "Base64", category: "Utilities" },
    { slug: "base64-decode", title: "Base64 Decode", sourceLabel: "Base64", targetLabel: "Text", category: "Utilities" },
    { slug: "jwt-decode", title: "JWT Decode", sourceLabel: "JWT", targetLabel: "JSON", category: "Utilities" },
  ],
  Others: [
    { slug: "markdown-to-html", title: "Markdown to HTML", sourceLabel: "Markdown", targetLabel: "HTML", category: "Others" },
    { slug: "xml-to-json", title: "XML to JSON", sourceLabel: "XML", targetLabel: "JSON", category: "Others" },
    { slug: "yaml-to-json", title: "YAML to JSON", sourceLabel: "YAML", targetLabel: "JSON", category: "Others" },
  ],
};

export const converterCategories = (Object.keys(byCategory) as ConverterCategory[]).filter(
  (category) => byCategory[category].length > 0,
);
export const convertersByCategory = byCategory;
export const converterRegistry = converterCategories.flatMap((category) => byCategory[category]);
export const defaultConverterSlug = "svg-to-jsx";

export function getConverterBySlug(slug: string): ConverterDefinition | undefined {
  return converterRegistry.find((converter) => converter.slug === slug);
}

export function getDefaultInput(slug: string): string {
  const converter = getConverterBySlug(slug);
  if (!converter) return "";

  const sampleBySource = new Map<string, string>([
    ["SVG", '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="#4f46e5" /></svg>'],
    ["HTML", "<div class=\"card\"><h1>Hello</h1></div>"],
    ["JSON", '{\n  "id": 1,\n  "name": "SyntaxShift",\n  "active": true,\n  "tags": ["tools", "convert"]\n}'],
    ["JSON Schema", '{\n  "title": "User",\n  "type": "object",\n  "properties": {\n    "id": { "type": "number" },\n    "name": { "type": "string" }\n  },\n  "required": ["id", "name"]\n}'],
    ["CSS", ".card { padding: 1rem; background: #f8fafc; border-radius: 8px; }"],
    ["JavaScript", "({ id: 1, name: 'SyntaxShift', enabled: true })"],
    ["Python", "def greet(name):\n    return f\"Hello, {name}\""],
    ["GraphQL", "type Query {\n  health: String!\n}"],
    ["JSON-LD", '{\n  "@context": "https://schema.org",\n  "@type": "Person",\n  "name": "Ada Lovelace"\n}'],
    ["TypeScript", "type User = {\n  id: number;\n  name: string;\n};"],
    ["Flow", "type User = {\n  id: number,\n  name: string,\n};"],
    ["Others", "name = \"syntaxshift\"\nversion = \"0.1.0\""],
  ]);

  if (converter.slug === "markdown-to-html") return "# SyntaxShift\n\nConvert anything.";
  if (converter.slug === "xml-to-json") return "<user><id>1</id><name>SyntaxShift</name></user>";
  if (converter.slug === "yaml-to-json" || converter.slug === "yaml-to-toml") return "id: 1\nname: SyntaxShift";
  if (converter.slug === "javascript-to-python") return "function greet(name) {\n  return `Hello, ${name}`;\n}";
  if (converter.slug === "toml-to-json" || converter.slug === "toml-to-yaml") return 'id = 1\nname = "SyntaxShift"';
  if (converter.slug === "cadence-to-go") return "pub contract Hello {}";
  if (converter.slug === "base64-encode") return "Hello, SyntaxShift!";
  if (converter.slug === "base64-decode") return "SGVsbG8sIFN5bnRheFNoaWZ0IQ==";
  if (converter.slug === "jwt-decode") return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlN5bnRheFNoaWZ0IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  return sampleBySource.get(converter.sourceLabel) ?? "";
}

export function getDefaultSettings(slug: string): ConverterSettings {
  const converter = getConverterBySlug(slug);
  if (!converter?.settings) return {};
  return converter.settings.reduce<ConverterSettings>((accumulator, setting) => {
    accumulator[setting.key] = setting.defaultValue;
    return accumulator;
  }, {});
}
