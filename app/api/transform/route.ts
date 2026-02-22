import { NextResponse } from "next/server";
import { z } from "zod";

import { getConverterBySlug } from "@/lib/converters/registry";

const bodySchema = z.object({
  slug: z.string().min(1),
  input: z.string(),
  settings: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
});

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY. Add it to your environment variables." },
      { status: 500 },
    );
  }

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }
    if (!parsed.data.input.trim()) {
      return NextResponse.json({ output: "" });
    }

    const converter = getConverterBySlug(parsed.data.slug);
    if (!converter) {
      return NextResponse.json({ error: "Unsupported transform mode." }, { status: 400 });
    }

    const settingsText = parsed.data.settings
      ? `Settings: ${JSON.stringify(parsed.data.settings)}`
      : "Settings: none";

    const prompt = [
      "You are a precise data/code transformation engine.",
      "Convert the input strictly according to the requested mode.",
      `Mode: ${converter.title} (${converter.sourceLabel} -> ${converter.targetLabel})`,
      settingsText,
      "",
      "Rules:",
      "1) Return only the transformed result.",
      "2) Do not include markdown fences, explanations, or notes.",
      "3) If conversion is impossible, return a short single-line error starting with: ERROR:",
      "",
      "Input:",
      parsed.data.input,
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    const gemini = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      return NextResponse.json({ error: gemini.error?.message ?? "Gemini transform failed." }, { status: 502 });
    }

    const output = gemini.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
    if (!output) {
      return NextResponse.json({ error: "Gemini returned empty output." }, { status: 502 });
    }

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transform failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
