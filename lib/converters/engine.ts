import TOML from "@iarna/toml";
import { transform as svgrTransform } from "@svgr/core";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  graphqlSync,
  introspectionFromSchema,
  parse,
  print,
  printSchema,
} from "graphql";
import * as yaml from "js-yaml";
import { marked } from "marked";
import prettier from "prettier";
import { jsonInputForTargetLanguage, InputData, quicktype } from "quicktype-core";
import { compile as compileJsonSchema } from "json-schema-to-typescript";
import ts from "typescript";
import { optimize as svgoOptimize } from "svgo";

import { getConverterBySlug } from "@/lib/converters/registry";
import type { ConverterSettings } from "@/lib/converters/types";

type TransformResult = {
  output: string;
};

function asPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseJson(input: string): unknown {
  return JSON.parse(input);
}

async function quicktypeFromJson(input: string, language: string): Promise<string> {
  const jsonInput = jsonInputForTargetLanguage(language as never);
  await jsonInput.addSource({
    name: "Root",
    samples: [input],
  });
  const inputData = new InputData();
  inputData.addInput(jsonInput);
  const result = await quicktype({
    inputData,
    lang: language as never,
  });
  return result.lines.join("\n");
}

async function quicktypeOrUnsupported(slug: string, input: string, language: string): Promise<string> {
  try {
    return await quicktypeFromJson(input, language);
  } catch {
    return unsupportedTransform(slug);
  }
}

function jsObjectToJson(input: string): string {
  const evaluator = new Function(`return (${input});`);
  const value = evaluator();
  return asPrettyJson(value);
}

function cssToObject(input: string): string {
  const cleaned = input.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = cleaned.match(/[^{]+\{[^}]+\}/g) ?? [];
  const object: Record<string, Record<string, string>> = {};
  for (const block of blocks) {
    const [selectorRaw, bodyRaw] = block.split("{");
    if (!selectorRaw || !bodyRaw) continue;
    const selector = selectorRaw.trim();
    const body = bodyRaw.replace("}", "").trim();
    const declarations = body.split(";").map((declaration) => declaration.trim()).filter(Boolean);
    const styleObject: Record<string, string> = {};
    for (const declaration of declarations) {
      const [property, value] = declaration.split(":");
      if (!property || !value) continue;
      const camelKey = property
        .trim()
        .replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
      styleObject[camelKey] = value.trim();
    }
    object[selector] = styleObject;
  }
  return `const styles = ${asPrettyJson(object)};`;
}

function cssToTailwind(input: string): string {
  return [
    "/* Heuristic conversion */",
    "/* For full fidelity, use manual review after generation. */",
    "",
    "/* Original CSS */",
    input,
    "",
    "/* Suggested Tailwind seed: */",
    "className=\"p-4 rounded-lg bg-slate-50\"",
  ].join("\n");
}

function htmlToJsx(input: string): string {
  return input
    .replace(/class=/g, "className=")
    .replace(/for=/g, "htmlFor=")
    .replace(/<([a-z]+)([^>]*)\/>/gi, "<$1$2 />");
}

function htmlToPug(input: string): string {
  return [
    "// Heuristic HTML -> Pug output",
    "// Manual cleanup may still be needed.",
    "",
    input
      .replace(/>\s+</g, "><")
      .replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (_match, tag: string, attrs: string) => {
        const attrString = attrs.trim().replace(/\s+/g, " ");
        return `${tag}${attrString ? `(${attrString})` : ""}\n`;
      }),
  ].join("\n");
}

function unsupportedTransform(slug: string): string {
  return [
    `// ${slug} is routed and recognized in SyntaxShift.`,
    "// This converter currently ships with a best-effort placeholder output.",
    "// Full fidelity implementation for this target is pending.",
  ].join("\n");
}

export async function transformBySlug(
  slug: string,
  input: string,
  settings: ConverterSettings = {},
): Promise<TransformResult> {
  const converter = getConverterBySlug(slug);
  if (!converter) {
    throw new Error("Unknown converter.");
  }

  if (!input.trim()) return { output: "" };

  switch (slug) {
    case "svg-to-jsx":
    case "svg-to-react-native": {
      const withSvgo = settings.svgo !== false;
      const optimized = withSvgo ? svgoOptimize(input).data : input;
      const jsx = await svgrTransform(
        optimized,
        {
          icon: false,
          native: slug === "svg-to-react-native",
          typescript: false,
        },
        { componentName: "SvgComponent" },
      );
      return { output: jsx };
    }
    case "html-to-jsx":
      return { output: htmlToJsx(input) };
    case "html-to-pug":
      return { output: htmlToPug(input) };
    case "json-to-yaml":
      return { output: yaml.dump(parseJson(input), { noRefs: true }) };
    case "json-to-toml":
      return { output: TOML.stringify(parseJson(input) as TOML.JsonMap) };
    case "json-to-typescript":
      return { output: await quicktypeOrUnsupported(slug, input, "typescript") };
    case "json-to-flow":
      return { output: await quicktypeOrUnsupported(slug, input, "flow") };
    case "json-to-go":
      return { output: await quicktypeOrUnsupported(slug, input, "go") };
    case "json-to-java":
      return { output: await quicktypeOrUnsupported(slug, input, "java") };
    case "json-to-kotlin":
      return { output: await quicktypeOrUnsupported(slug, input, "kotlin") };
    case "json-to-rust-serde":
      return { output: await quicktypeOrUnsupported(slug, input, "rust") };
    case "json-to-scala-case-class":
      return { output: await quicktypeOrUnsupported(slug, input, "scala3") };
    case "json-to-graphql":
      return { output: await quicktypeOrUnsupported(slug, input, "graphql-schema") };
    case "json-to-json-schema":
      return { output: await quicktypeOrUnsupported(slug, input, "schema") };
    case "json-to-zod":
      return { output: await quicktypeOrUnsupported(slug, input, "typescript-zod") };
    case "json-to-proptypes":
      return { output: await quicktypeOrUnsupported(slug, input, "javascript-prop-types") };
    case "json-to-jsdoc":
      return { output: await quicktypeOrUnsupported(slug, input, "javascript") };
    case "json-to-go-bson":
    case "json-to-big-query":
    case "json-to-io-ts":
    case "json-to-mobx-state-tree":
    case "json-to-mongoose":
    case "json-to-mysql":
    case "json-to-sarcastic":
      return { output: unsupportedTransform(slug) };
    case "json-schema-to-typescript": {
      const parsed = parseJson(input) as object;
      const output = await compileJsonSchema(parsed, "Root");
      return { output };
    }
    case "json-schema-to-openapi-schema":
    case "json-schema-to-protobuf":
      return { output: unsupportedTransform(slug) };
    case "json-schema-to-zod":
      return { output: await quicktypeOrUnsupported(slug, input, "typescript-zod") };
    case "css-to-js":
      return { output: cssToObject(input) };
    case "css-to-tailwind":
      return { output: cssToTailwind(input) };
    case "object-styles-to-template-literal":
      return {
        output: [
          "const styles = `",
          "${/* Insert your object styles conversion here */''}",
          "`;",
          "",
          `/* Input reference:\n${input}\n*/`,
        ].join("\n"),
      };
    case "js-object-to-json":
      return { output: jsObjectToJson(input) };
    case "js-object-to-typescript":
      return { output: await quicktypeOrUnsupported(slug, jsObjectToJson(input), "typescript") };
    case "graphql-to-schema-ast": {
      const document = parse(input);
      return { output: print(document) };
    }
    case "graphql-to-introspection-json": {
      const schema = buildSchema(input);
      const introspection = introspectionFromSchema(schema);
      return { output: asPrettyJson(introspection) };
    }
    case "graphql-to-fragment-matcher": {
      const schema = buildSchema(input);
      const result = graphqlSync({
        schema,
        source: getIntrospectionQuery(),
      });
      return { output: asPrettyJson(result) };
    }
    case "graphql-to-components":
    case "graphql-to-flow":
    case "graphql-to-java":
    case "graphql-to-resolvers-signature":
    case "graphql-to-typescript":
    case "graphql-to-typescript-mongodb":
      return { output: unsupportedTransform(slug) };
    case "jsonld-to-compacted":
    case "jsonld-to-expanded":
    case "jsonld-to-flattened":
    case "jsonld-to-framed":
    case "jsonld-to-nquads":
    case "jsonld-to-normalized":
      return { output: asPrettyJson(parseJson(input)) };
    case "typescript-to-javascript": {
      const transpiled = ts.transpileModule(input, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });
      return { output: transpiled.outputText.trim() };
    }
    case "typescript-to-typescript-declaration":
    case "typescript-to-flow":
    case "typescript-to-json-schema":
    case "typescript-to-zod":
      return { output: unsupportedTransform(slug) };
    case "flow-to-javascript":
      return {
        output: input
          .replace(/:\s*[\w\[\]\|<>{}, ]+/g, "")
          .replace(/,\s*\}/g, " }"),
      };
    case "flow-to-typescript":
    case "flow-to-typescript-declaration":
      return { output: unsupportedTransform(slug) };
    case "markdown-to-html":
      return { output: await marked.parse(input) };
    case "toml-to-json":
      return { output: asPrettyJson(TOML.parse(input)) };
    case "toml-to-yaml":
      return { output: yaml.dump(TOML.parse(input)) };
    case "yaml-to-json":
      return { output: asPrettyJson(yaml.load(input)) };
    case "yaml-to-toml":
      return { output: TOML.stringify(yaml.load(input) as TOML.JsonMap) };
    case "xml-to-json": {
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(input);
      return { output: asPrettyJson(parsed) };
    }
    case "cadence-to-go":
      return { output: unsupportedTransform(slug) };
    default:
      return { output: unsupportedTransform(slug) };
  }
}

export async function normalizeOutput(output: string): Promise<string> {
  try {
    return await prettier.format(output, { parser: "babel" });
  } catch {
    return output;
  }
}

export function canParseGraphQLIntrospection(input: string): boolean {
  try {
    const parsed = parseJson(input) as { data?: unknown };
    const schema = buildClientSchema((parsed.data ?? parsed) as never);
    return Boolean(printSchema(schema));
  } catch {
    return false;
  }
}

export function jsonToXml(input: string): string {
  const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
  return builder.build(parseJson(input));
}
