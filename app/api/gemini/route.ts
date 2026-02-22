import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  converterTitle: z.string().min(1),
  sourceLabel: z.string().min(1),
  targetLabel: z.string().min(1),
  input: z.string(),
  output: z.string(),
  instruction: z.string().min(1),
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
    const payload = await request.json();
    const parsed = bodySchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Gemini request payload." }, { status: 400 });
    }

    const prompt = [
      "You are assisting in a code/data transformer app called SyntaxShift.",
      `Converter: ${parsed.data.converterTitle} (${parsed.data.sourceLabel} -> ${parsed.data.targetLabel})`,
      `Instruction: ${parsed.data.instruction}`,
      "",
      "User input:",
      parsed.data.input,
      "",
      "Current transformed output:",
      parsed.data.output,
      "",
      "Return concise, practical guidance. If rewriting output helps, include a corrected output block.",
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 700,
          },
        }),
      },
    );

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      return NextResponse.json({ error: json.error?.message ?? "Gemini API request failed." }, { status: 502 });
    }

    const reply = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
    if (!reply) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
