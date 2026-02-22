"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";

import { ConverterNav } from "@/components/converter-nav";
import { EditorPane } from "@/components/editor-pane";
import { SettingsPanel } from "@/components/settings-panel";
import { transformInFrontend } from "@/lib/converters/frontend-engine";
import { getConverterBySlug, getDefaultInput, getDefaultSettings } from "@/lib/converters/registry";
import type { ConverterSettings } from "@/lib/converters/types";

type ConverterShellProps = {
  slug: string;
};

export function ConverterShell({ slug }: ConverterShellProps) {
  const converter = useMemo(() => getConverterBySlug(slug), [slug]);
  const [input, setInput] = useState(() => getDefaultInput(slug));
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settings, setSettings] = useState<ConverterSettings>(() => getDefaultSettings(slug));

  useEffect(() => {
    setInput(getDefaultInput(slug));
    setOutput("");
    setError("");
    setSettings(getDefaultSettings(slug));
    setMobileNavOpen(false);
  }, [slug]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await transformInFrontend(slug, input, settings);
        setOutput(result.output);
      } catch (requestError) {
        setOutput("");
        setError(requestError instanceof Error ? requestError.message : "Transformation failed.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [input, settings, slug]);

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!converter) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Converter not found.</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.91_0.09_280_/_0.25),transparent_45%),radial-gradient(circle_at_bottom_left,oklch(0.88_0.06_220_/_0.22),transparent_42%)]" />
      <ConverterNav className="hidden lg:block" />

      <div
        aria-hidden={!mobileNavOpen}
        className={`fixed inset-0 z-40 lg:hidden ${mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <button
          aria-label="Close menu"
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileNavOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
        <ConverterNav
          className={`absolute left-0 top-0 h-full w-[84%] max-w-80 border-r border-border/70 shadow-xl transition-transform duration-300 ease-out ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </div>
      <section className="relative z-10 flex min-h-screen flex-1 flex-col p-3 md:p-4">
        <header className="rounded-2xl border border-border/70 bg-card/80 px-4 py-4 shadow-sm backdrop-blur md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <button
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                className="mb-2 inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 text-foreground lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                type="button"
              >
                <Menu className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-semibold tracking-tight">{converter.title}</h2>
              <p className="text-sm text-muted-foreground/90">
                {converter.sourceLabel} to {converter.targetLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {mobileNavOpen ? (
                <button
                  aria-label="Close menu"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 text-foreground lg:hidden"
                  onClick={() => setMobileNavOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <button
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
                disabled={!output}
                onClick={copyOutput}
                type="button"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          {converter.settings?.length ? (
            <div className="mt-4 rounded-xl border border-border/80 bg-background/70 p-3">
              <SettingsPanel
                converter={converter}
                onChange={(key, value) => setSettings((current) => ({ ...current, [key]: value }))}
                settings={settings}
              />
            </div>
          ) : null}
        </header>

        <section className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
          <EditorPane
            label={converter.sourceLabel}
            onChange={setInput}
            placeholder="Paste input..."
            value={input}
          />
          <EditorPane
            label={converter.targetLabel}
            placeholder={loading ? "Transforming..." : "Output..."}
            readOnly
            value={error ? `Error: ${error}` : output}
          />
        </section>
      </section>
    </main>
  );
}
