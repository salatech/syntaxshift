import { describe, expect, it } from "vitest";

import { converterCategories, converterRegistry, convertersByCategory } from "../lib/converters/registry";

describe("converter registry", () => {
  it("has unique slugs", () => {
    const allSlugs = converterRegistry.map((converter) => converter.slug);
    const uniqueSlugs = new Set(allSlugs);
    expect(uniqueSlugs.size).toBe(allSlugs.length);
  });

  it("has non-empty categories", () => {
    for (const category of converterCategories) {
      expect(convertersByCategory[category].length).toBeGreaterThan(0);
    }
  });

  it("includes full transform.tools catalog currently tracked", () => {
    expect(converterRegistry.length).toBe(15);
  });
});
