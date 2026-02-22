import { describe, expect, it } from "vitest";

import { converterRegistry, getDefaultInput, getDefaultSettings } from "../lib/converters/registry";
import { transformInFrontend } from "../lib/converters/frontend-engine";

describe("transform engine", () => {
  it("transforms svg to jsx", async () => {
    const result = await transformInFrontend(
      "svg-to-jsx",
      getDefaultInput("svg-to-jsx"),
      getDefaultSettings("svg-to-jsx"),
    );
    expect(result.output).toContain("<svg");
  });

  it("transforms json to yaml", async () => {
    const result = await transformInFrontend(
      "json-to-yaml",
      getDefaultInput("json-to-yaml"),
      getDefaultSettings("json-to-yaml"),
    );
    expect(result.output).toContain("name:");
  });

  it("creates named nested interfaces for json-to-typescript", async () => {
    const result = await transformInFrontend(
      "json-to-typescript",
      '{ "success": true, "user": { "id": "1", "email": "x@example.com" } }',
      {},
    );
    expect(result.output).toContain("export interface Root");
    expect(result.output).toContain("user: User");
    expect(result.output).toContain("export interface User");
  });

  it("handles plain JSON objects in json-schema-to-typescript mode", async () => {
    const result = await transformInFrontend(
      "json-schema-to-typescript",
      '{ "user": { "id": "1", "active": true } }',
      {},
    );
    expect(result.output).toContain("export interface Root");
    expect(result.output).toContain('"user":');
  });

  it("transforms python to javascript", async () => {
    const result = await transformInFrontend("python-to-javascript", "def greet(name):\n    return name", {});
    expect(result.output).toContain("function greet(name) {");
    expect(result.output).toContain("return name;");
  });

  it("transforms javascript to python", async () => {
    const result = await transformInFrontend(
      "javascript-to-python",
      "function greet(name) {\n  console.log(name);\n}",
      {},
    );
    expect(result.output).toContain("def greet(name):");
    expect(result.output).toContain("print(name)");
  });

  it("resolves every registered converter slug without throwing", async () => {
    for (const converter of converterRegistry) {
      const input = getDefaultInput(converter.slug);
      const settings = getDefaultSettings(converter.slug);
      const result = await transformInFrontend(converter.slug, input, settings);
      expect(typeof result.output).toBe("string");
      expect(result.output.length).toBeGreaterThanOrEqual(0);
    }
  });
});
