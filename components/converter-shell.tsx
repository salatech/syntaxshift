"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";

import { ConverterNav } from "@/components/converter-nav";
import { EditorPane } from "@/components/editor-pane";
import { SettingsPanel } from "@/components/settings-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { detectFormat, getSuggestedConverters } from "@/lib/detect-format";
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
  const [reversed, setReversed] = useState(false);

  useEffect(() => {
    setInput(getDefaultInput(slug));
    setOutput("");
    setError("");
    setSettings(getDefaultSettings(slug));
    setMobileNavOpen(false);
    setReversed(false);
  }, [slug]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const activeSlug = reversed && converter?.reverseSlug ? converter.reverseSlug : slug;
        const result = await transformInFrontend(activeSlug, input, settings);
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
  }, [input, settings, slug, reversed, converter]);

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
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mobileNavOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
        <ConverterNav
          className={`absolute left-0 top-0 h-full w-[84%] max-w-80 border-r border-border/70 shadow-xl transition-transform duration-300 ease-out ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </div>
      <section className="relative z-10 flex min-h-screen flex-1 flex-col p-3 md:p-4">
        <header className="border border-border/70 bg-card/80 px-4 py-4 shadow-sm backdrop-blur md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2.5 lg:hidden">
                <button
                  aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                  className="inline-flex shrink-0 items-center justify-center border border-border bg-background p-2 text-foreground"
                  onClick={() => setMobileNavOpen(true)}
                  type="button"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <span className="text-base font-bold tracking-tight text-foreground">SyntaxShift</span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{converter.title}</h2>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground/90">
                <span>{reversed ? converter.targetLabel : converter.sourceLabel}</span>
                {converter.reversible ? (
                  <button
                    aria-label="Swap direction"
                    className="inline-flex items-center justify-center p-0.5 text-muted-foreground transition hover:text-foreground"
                    onClick={() => {
                      setReversed((r) => !r);
                      setInput("");
                      setOutput("");
                    }}
                    type="button"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span>to</span>
                )}
                <span>{reversed ? converter.sourceLabel : converter.targetLabel}</span>
              </div>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              {mobileNavOpen ? (
                <button
                  aria-label="Close menu"
                  className="inline-flex items-center justify-center border border-border bg-background p-2 text-foreground lg:hidden"
                  onClick={() => setMobileNavOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <ThemeToggle />
              <button
                className="border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
                disabled={!output}
                onClick={copyOutput}
                type="button"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          {converter.settings?.length ? (
            <div className="mt-4 border border-border/80 bg-background/70 p-3">
              <SettingsPanel
                converter={converter}
                onChange={(key, value) => setSettings((current) => ({ ...current, [key]: value }))}
                settings={settings}
              />
            </div>
          ) : null}
        </header>

        {(() => {
          const detected = input.trim().length > 10 ? detectFormat(input) : null;
          const suggestions = detected ? getSuggestedConverters(detected.label, slug) : [];
          if (!detected || suggestions.length === 0) return null;
          return (
            <div className="mt-2 flex flex-wrap items-center gap-2 border border-border/60 bg-card/60 px-3 py-2 text-xs backdrop-blur transition-all">
              <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Detected <span className="bg-primary/15 px-1.5 py-0.5 font-semibold text-foreground">{detected.label}</span>
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="text-muted-foreground">Try:</span>
              {suggestions.slice(0, 4).map((s) => (
                <Link
                  className="border border-border/80 bg-background px-2 py-0.5 font-medium text-foreground transition hover:bg-accent"
                  href={`/${s.slug}`}
                  key={s.slug}
                >
                  {s.title}
                </Link>
              ))}
            </div>
          );
        })()}

        <section className="relative mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 pb-20 lg:grid-cols-2 lg:pb-0">
          <EditorPane
            label={reversed ? converter.targetLabel : converter.sourceLabel}
            language={reversed ? converter.targetLabel : converter.sourceLabel}
            onChange={setInput}
            placeholder="Paste input..."
            value={input}
          />

          {converter.reversible && (
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <button
                aria-label="Swap direction"
                className="flex h-10 w-10 items-center justify-center border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setReversed((r) => !r);
                  setInput("");
                  setOutput("");
                }}
                type="button"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <EditorPane
            label={reversed ? converter.sourceLabel : converter.targetLabel}
            language={reversed ? converter.sourceLabel : converter.targetLabel}
            placeholder={loading ? "Transforming..." : "Output..."}
            readOnly
            value={error ? `Error: ${error}` : output}
          />
        </section>
      </section>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border/70 bg-card/95 px-3 py-2.5 backdrop-blur lg:hidden">
        <button
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent"
          onClick={() => setMobileNavOpen(true)}
          type="button"
        >
          <Menu className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[160px] truncate">{converter.title}</span>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
            disabled={!output}
            onClick={copyOutput}
            type="button"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </main>
  );
}
