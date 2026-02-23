"use client";

import { Extension } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import { yaml } from "@codemirror/lang-yaml";
import { xml } from "@codemirror/lang-xml";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { css } from "@codemirror/lang-css";

export function getLanguageExtension(label: string): Extension | null {
    switch (label) {
        case "JSON":
        case "JSON Schema":
            return json();
        case "YAML":
            return yaml();
        case "XML":
        case "SVG":
            return xml();
        case "HTML":
            return html();
        case "JavaScript":
        case "JSX":
            return javascript({ jsx: true });
        case "TypeScript":
            return javascript({ jsx: true, typescript: true });
        case "Python":
            return python();
        case "Markdown":
            return markdown();
        case "CSS":
            return css();
        default:
            return null;
    }
}
