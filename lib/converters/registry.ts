import type { ConverterCategory, ConverterDefinition, ConverterSettings } from "@/lib/converters/types";

const byCategory: Record<ConverterCategory, ConverterDefinition[]> = {
  Utilities: [
    { slug: "base64-encode", title: "Base64 Encode / Decode", sourceLabel: "Text", targetLabel: "Base64", category: "Utilities", reversible: true, reverseSlug: "base64-decode" },
    { slug: "url-encode", title: "URL Encode / Decode", sourceLabel: "Text", targetLabel: "URL Encoded", category: "Utilities", reversible: true, reverseSlug: "url-decode" },
    { slug: "rot13-encode", title: "ROT13 Cipher", sourceLabel: "Text", targetLabel: "ROT13", category: "Utilities", reversible: true, reverseSlug: "rot13-decode" },
    { slug: "jwt-decode", title: "JWT Decode", sourceLabel: "JWT", targetLabel: "JSON", category: "Utilities" },
  ],
  "Programming Languages": [
    {
      slug: "python-to-javascript",
      title: "Python / JavaScript",
      sourceLabel: "Python",
      targetLabel: "JavaScript",
      category: "Programming Languages",
      reversible: true,
      reverseSlug: "javascript-to-python",
    },
  ],
  JSON: [
    { slug: "json-to-typescript", title: "JSON to TypeScript", sourceLabel: "JSON", targetLabel: "TypeScript", category: "JSON" },
    { slug: "json-to-yaml", title: "JSON / YAML", sourceLabel: "JSON", targetLabel: "YAML", category: "JSON", reversible: true, reverseSlug: "yaml-to-json" },
    { slug: "json-to-zod", title: "JSON to Zod Schema", sourceLabel: "JSON", targetLabel: "Zod", category: "JSON" },
  ],
  "JSON Schema": [
    { slug: "json-schema-to-typescript", title: "JSON Schema to TypeScript", sourceLabel: "JSON Schema", targetLabel: "TypeScript", category: "JSON Schema" },
  ],
  Others: [
    {
      slug: "svg-to-jsx",
      title: "SVG to JSX",
      sourceLabel: "SVG",
      targetLabel: "JSX",
      category: "Others",
      settings: [{ key: "svgo", label: "SVGO optimization", type: "boolean", defaultValue: true }],
    },
    { slug: "html-to-jsx", title: "HTML to JSX", sourceLabel: "HTML", targetLabel: "JSX", category: "Others" },
    { slug: "markdown-to-html", title: "Markdown to HTML", sourceLabel: "Markdown", targetLabel: "HTML", category: "Others" },
    { slug: "xml-to-json", title: "XML to JSON", sourceLabel: "XML", targetLabel: "JSON", category: "Others" },
  ],
};

export const converterCategories = Object.keys(byCategory) as ConverterCategory[];
export const convertersByCategory = byCategory;
export const converterRegistry = converterCategories.flatMap((category) => byCategory[category]);
export const defaultConverterSlug = "jwt-decode";

export function getConverterBySlug(slug: string): ConverterDefinition | undefined {
  return converterRegistry.find((converter) => converter.slug === slug);
}

export function getDefaultInput(slug: string): string {
  const converter = getConverterBySlug(slug);
  if (!converter) return "";

  const defaults: Record<string, string> = {
    "svg-to-jsx": '<svg width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="#4f46e5" /></svg>',
    "html-to-jsx": '<div class="card"><h1>Hello</h1></div>',
    "json-to-typescript": '{\n  "id": 1,\n  "name": "SyntaxShift",\n  "active": true,\n  "tags": ["tools", "convert"]\n}',
    "json-to-yaml": '{\n  "id": 1,\n  "name": "SyntaxShift",\n  "active": true\n}',
    "json-to-zod": '{\n  "id": 1,\n  "name": "SyntaxShift",\n  "active": true,\n  "tags": ["tools", "convert"]\n}',
    "json-schema-to-typescript": '{\n  "title": "User",\n  "type": "object",\n  "properties": {\n    "id": { "type": "number" },\n    "name": { "type": "string" }\n  },\n  "required": ["id", "name"]\n}',
    "python-to-javascript": "def greet(name):\n    return f\"Hello, {name}\"",
    "javascript-to-python": "function greet(name) {\n  return `Hello, ${name}`;\n}",
    "markdown-to-html": "# SyntaxShift\n\nConvert anything.",
    "xml-to-json": "<user><id>1</id><name>SyntaxShift</name></user>",
    "yaml-to-json": "id: 1\nname: SyntaxShift",
    "base64-encode": "Hello, SyntaxShift!",
    "base64-decode": "SGVsbG8sIFN5bnRheFNoaWZ0IQ==",
    "url-encode": "Hello World! How are you?",
    "url-decode": "Hello%20World%21%20How%20are%20you%3F",
    "rot13-encode": "Hello, SyntaxShift!",
    "rot13-decode": "Uryyb, FlagnkFuvsg!",
    "jwt-decode": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlN5bnRheFNoaWZ0IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  };

  return defaults[slug] ?? "";
}

export function getDefaultSettings(slug: string): ConverterSettings {
  const converter = getConverterBySlug(slug);
  if (!converter?.settings) return {};
  return converter.settings.reduce<ConverterSettings>((accumulator, setting) => {
    accumulator[setting.key] = setting.defaultValue;
    return accumulator;
  }, {});
}
