import { converterRegistry } from "@/lib/converters/registry";
import type { ConverterDefinition } from "@/lib/converters/types";

export type DetectedFormat = {
    label: string;
    confidence: "high" | "medium";
};

export function detectFormat(input: string): DetectedFormat | null {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 3) return null;

    // JWT — 3 dot-separated base64url segments
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)) {
        return { label: "JWT", confidence: "high" };
    }

    // JSON — starts with { or [
    if (/^[\[{]/.test(trimmed)) {
        try {
            JSON.parse(trimmed);
            // Check for JSON Schema specifically
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.type && (parsed.properties || parsed.items)) {
                return { label: "JSON Schema", confidence: "medium" };
            }
            return { label: "JSON", confidence: "high" };
        } catch {
            // might still be lenient JSON, but report as JSON
            if (/[{[]/.test(trimmed) && /[}\]]/.test(trimmed)) {
                return { label: "JSON", confidence: "medium" };
            }
        }
    }

    // SVG — starts with <svg
    if (/^<svg[\s>]/i.test(trimmed)) {
        return { label: "SVG", confidence: "high" };
    }

    // HTML — contains common HTML tags
    if (/^<!doctype\s+html/i.test(trimmed) || (/^</.test(trimmed) && /<(div|span|p|h[1-6]|section|article|main|header|footer|nav|form|input|button|img|a)\b/i.test(trimmed))) {
        return { label: "HTML", confidence: "high" };
    }

    // XML — starts with < or <?xml
    if (/^<\?xml/i.test(trimmed) || (/^<[a-zA-Z]/.test(trimmed) && /<\/[a-zA-Z]/.test(trimmed))) {
        return { label: "XML", confidence: "medium" };
    }

    // Python — def, import, class, print(
    if (/^(def |import |from |class |print\(|if __name__)/m.test(trimmed)) {
        return { label: "Python", confidence: "medium" };
    }

    // JavaScript — function, const, let, =>, console.
    if (/^(function |const |let |var |export |import )/m.test(trimmed) || /=>/.test(trimmed) || /console\./.test(trimmed)) {
        return { label: "JavaScript", confidence: "medium" };
    }

    // Markdown — headings, bold, links
    if (/^#{1,6}\s/m.test(trimmed) || /\*\*[^*]+\*\*/.test(trimmed) || /\[[^\]]+\]\([^)]+\)/.test(trimmed)) {
        return { label: "Markdown", confidence: "medium" };
    }

    // YAML — key: value patterns without curly braces
    if (/^[a-zA-Z_][\w]*:\s/m.test(trimmed) && !trimmed.startsWith("{")) {
        return { label: "YAML", confidence: "medium" };
    }

    // Base64 — long alphanumeric string with optional padding
    if (/^[A-Za-z0-9+/]{20,}={0,2}$/.test(trimmed.replace(/\s/g, ""))) {
        return { label: "Base64", confidence: "medium" };
    }

    return null;
}

export function getSuggestedConverters(format: string, currentSlug: string): ConverterDefinition[] {
    return converterRegistry.filter(
        (converter) => converter.sourceLabel === format && converter.slug !== currentSlug
    );
}
