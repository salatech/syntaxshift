"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { converterCategories, convertersByCategory } from "@/lib/converters/registry";

type ConverterNavProps = {
  className?: string;
  onNavigate?: () => void;
};

export function ConverterNav({ className, onNavigate }: ConverterNavProps) {
  const pathname = usePathname();
  const activeSlug = pathname.replace("/", "") || "svg-to-jsx";

  return (
    <aside
      className={cn(
        "relative z-10 w-full border-b border-border/70 bg-card/85 backdrop-blur lg:w-80 lg:border-r lg:border-b-0",
        className,
      )}
    >
      <div className="border-b border-border/70 px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight">SyntaxShift</h1>
        <p className="text-sm text-muted-foreground">Smart format transformations</p>
      </div>
      <div className="h-[calc(100vh-73px)] overflow-y-auto px-3 py-4">
        {converterCategories.map((category) => (
          <section className="mb-6" key={category}>
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</h2>
            <ul className="space-y-1">
              {convertersByCategory[category].map((converter) => (
                <li key={converter.slug}>
                  <Link
                    className={cn(
                      "block px-2.5 py-1.5 text-sm transition-colors hover:bg-accent/80",
                      converter.slug === activeSlug
                        ? "bg-primary/12 font-medium text-foreground ring-1 ring-primary/25"
                        : "text-foreground/85",
                    )}
                    href={`/${converter.slug}`}
                    onClick={onNavigate}
                  >
                    {`${converter.sourceLabel} -> ${converter.targetLabel}`}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
