import { XMLParser } from "fast-xml-parser";
import * as yaml from "js-yaml";
import { marked } from "marked";

import type { ConverterSettings } from "@/lib/converters/types";

type TransformResult = {
  output: string;
};

function parseJsonLenient(input: string): unknown {
  const trimmed = input.trim();
  const tryParse = (value: string): unknown => JSON.parse(value);

  const candidates = [
    trimmed,
    trimmed.replace(/,\s*([}\]])/g, "$1"),
    `{${trimmed}}`,
    `{${trimmed}}`.replace(/,\s*([}\]])/g, "$1"),
  ];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return tryParse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Invalid JSON input: ${lastError.message}`);
  }
  throw new Error("Invalid JSON input.");
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function toPascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join("") || "Root";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidTsIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function formatPropertyName(value: string): string {
  return isValidTsIdentifier(value) ? value : JSON.stringify(value);
}

function uniqueInterfaceName(base: string, used: Map<string, number>): string {
  const current = used.get(base) ?? 0;
  used.set(base, current + 1);
  return current === 0 ? base : `${base}${current + 1}`;
}

function inferNamedTypeFromValue(
  value: unknown,
  suggestedName: string,
  declarations: string[],
  usedNames: Map<string, number>,
): string {
  if (value === null) return "null";

  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    const memberTypes = Array.from(
      new Set(
        value.map((item) => inferNamedTypeFromValue(item, `${suggestedName}Item`, declarations, usedNames)),
      ),
    );
    return memberTypes.length === 1 ? `${memberTypes[0]}[]` : `(${memberTypes.join(" | ")})[]`;
  }

  if (isPlainObject(value)) {
    const interfaceName = uniqueInterfaceName(toPascalCase(suggestedName), usedNames);
    const lines = Object.entries(value).map(([key, child]) => {
      const childType = inferNamedTypeFromValue(child, key, declarations, usedNames);
      return `${indent(1)}${formatPropertyName(key)}: ${childType}`;
    });
    declarations.push(`export interface ${interfaceName} {\n${lines.join("\n")}\n}`);
    return interfaceName;
  }

  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "unknown";
  }
}

function inferTypeFromValue(value: unknown, level = 1): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    const memberTypes = Array.from(new Set(value.map((item) => inferTypeFromValue(item, level + 1))));
    return memberTypes.length === 1 ? `${memberTypes[0]}[]` : `(${memberTypes.join(" | ")})[]`;
  }
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object": {
      const entries = Object.entries(value as Record<string, unknown>);
      if (!entries.length) return "Record<string, unknown>";
      const lines = entries.map(([key, child]) => `${indent(level)}${JSON.stringify(key)}: ${inferTypeFromValue(child, level + 1)};`);
      return `{\n${lines.join("\n")}\n${indent(level - 1)}}`;
    }
    default:
      return "unknown";
  }
}

function jsonToTypescript(input: string): string {
  const parsed = parseJsonLenient(input);
  if (!isPlainObject(parsed)) {
    const bodyType = inferTypeFromValue(parsed);
    return `export type Root = ${bodyType};\n`;
  }

  const declarations: string[] = [];
  const usedNames = new Map<string, number>();
  const rootLines = Object.entries(parsed).map(([key, child]) => {
    const childType = inferNamedTypeFromValue(child, key, declarations, usedNames);
    return `${indent(1)}${formatPropertyName(key)}: ${childType}`;
  });

  const rootInterface = `export interface Root {\n${rootLines.join("\n")}\n}`;
  return [rootInterface, ...declarations].join("\n\n") + "\n";
}

function jsonSchemaToTsType(schema: unknown, typeName = "Root", level = 0): string {
  const obj = schema as Record<string, unknown>;
  const schemaType = obj.type;

  if (obj.enum && Array.isArray(obj.enum)) {
    const enumValues = obj.enum.map((item) => JSON.stringify(item)).join(" | ");
    return enumValues || "unknown";
  }

  if (schemaType === "array") {
    const itemsType = jsonSchemaToTsType(obj.items ?? {}, `${typeName}Item`, level + 1);
    return `(${itemsType})[]`;
  }

  if (schemaType === "object" || obj.properties) {
    const required = new Set(Array.isArray(obj.required) ? (obj.required as string[]) : []);
    const properties = (obj.properties ?? {}) as Record<string, unknown>;
    const lines = Object.entries(properties).map(([key, childSchema]) => {
      const optional = required.has(key) ? "" : "?";
      return `${indent(level + 1)}${JSON.stringify(key)}${optional}: ${jsonSchemaToTsType(childSchema, toPascalCase(key), level + 1)};`;
    });
    return `{\n${lines.join("\n")}\n${indent(level)}}`;
  }

  switch (schemaType) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    default:
      return "unknown";
  }
}

function jsonSchemaToTypescript(input: string): string {
  const parsed = parseJsonLenient(input);
  const schemaObject = parsed as Record<string, unknown>;
  const isLikelyJsonSchema =
    typeof parsed === "object" &&
    parsed !== null &&
    ["$schema", "type", "properties", "required", "items", "$defs", "definitions", "allOf", "anyOf", "oneOf", "enum"].some(
      (key) => key in schemaObject,
    );

  if (!isLikelyJsonSchema) {
    const inferred = inferTypeFromValue(parsed, 1);
    if (inferred.startsWith("{")) {
      return `export interface Root ${inferred}\n`;
    }
    return `export interface Root {\n  value: ${inferred};\n}\n`;
  }

  const tsType = jsonSchemaToTsType(parsed, "Root", 0);
  return `export interface Root ${tsType}\n`;
}

function jsonToYaml(input: string): string {
  const parsed = parseJsonLenient(input);
  return yaml.dump(parsed, { noRefs: true }).trimEnd();
}

function yamlToJson(input: string): string {
  const parsed = yaml.load(input);
  return JSON.stringify(parsed, null, 2);
}

function xmlToJson(input: string): string {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(input);
  return JSON.stringify(parsed, null, 2);
}

function markdownToHtml(input: string): string {
  return marked.parse(input) as string;
}

function htmlToJsx(input: string): string {
  return input
    .replace(/\bclass=/g, "className=")
    .replace(/\bfor=/g, "htmlFor=")
    .replace(/\bonchange=/gi, "onChange=")
    .replace(/\bonclick=/gi, "onClick=");
}

function svgToJsx(input: string, settings: ConverterSettings): string {
  const optimized = settings.svgo === false
    ? input
    : input
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  return optimized
    .replace(/\bclass=/g, "className=")
    .replace(/\bstroke-width=/g, "strokeWidth=")
    .replace(/\bstroke-linecap=/g, "strokeLinecap=")
    .replace(/\bstroke-linejoin=/g, "strokeLinejoin=")
    .replace(/\bfill-rule=/g, "fillRule=")
    .replace(/\bclip-rule=/g, "clipRule=");
}

function pythonToJavaScript(input: string): string {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  const indentStack = [0];

  for (const rawLine of lines) {
    const leadingSpaces = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      output.push("");
      continue;
    }

    while (leadingSpaces < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      output.push(`${indent(indentStack.length - 1)}}`);
    }

    let converted = trimmed;
    converted = converted.replace(/^def\s+([A-Za-z_]\w*)\(([^)]*)\):$/, "function $1($2) {");
    converted = converted.replace(/^if\s+(.+):$/, "if ($1) {");
    converted = converted.replace(/^elif\s+(.+):$/, "} else if ($1) {");
    converted = converted.replace(/^else:$/, "} else {");
    converted = converted.replace(/^for\s+(\w+)\s+in\s+range\((.+)\):$/, "for (let $1 = 0; $1 < $2; $1 += 1) {");
    converted = converted.replace(/^while\s+(.+):$/, "while ($1) {");
    converted = converted.replace(/^print\((.*)\)$/, "console.log($1);");
    converted = converted.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, "null");
    converted = converted.replace(/^return\s+(.+)$/, "return $1;");

    const opensBlock = /{\s*$/.test(converted);
    output.push(`${indent(indentStack.length - 1)}${converted}`);
    if (opensBlock) {
      indentStack.push(leadingSpaces + 4);
    } else if (!/[;{}]$/.test(converted)) {
      output[output.length - 1] += ";";
    }
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    output.push(`${indent(indentStack.length - 1)}}`);
  }

  return output.join("\n");
}

function javascriptToPython(input: string): string {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let indentLevel = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      output.push("");
      continue;
    }

    if (trimmed === "}") {
      indentLevel = Math.max(0, indentLevel - 1);
      continue;
    }

    let converted = trimmed.replace(/;$/, "");

    converted = converted.replace(
      /^function\s+([A-Za-z_]\w*)\(([^)]*)\)\s*\{$/,
      (_match, name: string, args: string) => `def ${name}(${args}):`,
    );
    converted = converted.replace(/^if\s*\((.+)\)\s*\{$/, "if $1:");
    converted = converted.replace(/^\}\s*else if\s*\((.+)\)\s*\{$/, "elif $1:");
    converted = converted.replace(/^\}\s*else\s*\{$/, "else:");
    converted = converted.replace(/^else\s*\{$/, "else:");
    converted = converted.replace(/^while\s*\((.+)\)\s*\{$/, "while $1:");
    converted = converted.replace(
      /^for\s*\(let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(.+);\s*\1\s*\+=\s*1\)\s*\{$/,
      "for $1 in range($2):",
    );
    converted = converted.replace(/^console\.log\((.*)\)$/, "print($1)");
    converted = converted.replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False").replace(/\bnull\b/g, "None");

    if (/:\s*$/.test(converted)) {
      output.push(`${indent(indentLevel)}${converted}`);
      indentLevel += 1;
    } else {
      output.push(`${indent(indentLevel)}${converted}`);
    }
  }

  return output.join("\n");
}

function base64Encode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function base64Decode(input: string): string {
  return decodeURIComponent(escape(atob(input.trim())));
}

function jwtDecode(input: string): string {
  const parts = input.trim().split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT: expected 3 dot-separated parts.");

  const decodeBase64Url = (str: string): string => {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
  };

  const header = JSON.parse(decodeBase64Url(parts[0]));
  const payload = JSON.parse(decodeBase64Url(parts[1]));

  return JSON.stringify({ header, payload, signature: parts[2] }, null, 2);
}

function jsonPrettifyMinify(input: string, settings: ConverterSettings): string {
  const parsed = parseJsonLenient(input);
  const minify = settings.minify === true;
  return JSON.stringify(parsed, null, minify ? 0 : 2);
}

function inferZodType(value: unknown, indent: number = 0): string {
  const pad = "  ".repeat(indent);
  const innerPad = "  ".repeat(indent + 1);

  if (value === null) return "z.null()";
  if (typeof value === "string") return "z.string()";
  if (typeof value === "number") return Number.isInteger(value) ? "z.number().int()" : "z.number()";
  if (typeof value === "boolean") return "z.boolean()";

  if (Array.isArray(value)) {
    if (value.length === 0) return "z.array(z.unknown())";
    return `z.array(${inferZodType(value[0], indent)})`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "z.object({})";
    const fields = entries
      .map(([key, val]) => `${innerPad}${key}: ${inferZodType(val, indent + 1)}`)
      .join(",\n");
    return `z.object({\n${fields},\n${pad}})`;
  }

  return "z.unknown()";
}

function jsonToZod(input: string): string {
  const parsed = parseJsonLenient(input);
  return `import { z } from "zod";\n\nconst schema = ${inferZodType(parsed)};\n\ntype Schema = z.infer<typeof schema>;`;
}

export async function transformInFrontend(
  slug: string,
  input: string,
  settings: ConverterSettings = {},
): Promise<TransformResult> {
  if (!input.trim()) return { output: "" };

  switch (slug) {
    case "svg-to-jsx":
      return { output: svgToJsx(input, settings) };
    case "html-to-jsx":
      return { output: htmlToJsx(input) };
    case "json-to-typescript":
      return { output: jsonToTypescript(input) };
    case "json-to-yaml":
      return { output: jsonToYaml(input) };
    case "json-schema-to-typescript":
      return { output: jsonSchemaToTypescript(input) };
    case "yaml-to-json":
      return { output: yamlToJson(input) };
    case "xml-to-json":
      return { output: xmlToJson(input) };
    case "markdown-to-html":
      return { output: markdownToHtml(input) };
    case "python-to-javascript":
      return { output: pythonToJavaScript(input) };
    case "javascript-to-python":
      return { output: javascriptToPython(input) };
    case "base64-encode":
      return { output: base64Encode(input) };
    case "base64-decode":
      return { output: base64Decode(input) };
    case "jwt-decode":
      return { output: jwtDecode(input) };
    case "url-encode":
      return { output: encodeURIComponent(input) };
    case "url-decode":
      return { output: decodeURIComponent(input) };
    case "rot13-encode":
    case "rot13-decode":
      return { output: rot13(input) };
    case "json-to-zod":
      return { output: jsonToZod(input) };
    default:
      throw new Error("Unsupported transform mode.");
  }
}

function rot13(input: string): string {
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= "Z" ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}
