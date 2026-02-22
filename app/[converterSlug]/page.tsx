import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConverterShell } from "@/components/converter-shell";
import { getConverterBySlug } from "@/lib/converters/registry";

type ConverterPageProps = {
  params: Promise<{ converterSlug: string }>;
};

export async function generateMetadata({ params }: ConverterPageProps): Promise<Metadata> {
  const { converterSlug } = await params;
  const converter = getConverterBySlug(converterSlug);
  if (!converter) {
    return {
      title: "Converter not found",
      description: "The requested converter was not found on SyntaxShift.",
    };
  }

  const title = `${converter.sourceLabel} to ${converter.targetLabel}`;
  const description = `Convert ${converter.sourceLabel} to ${converter.targetLabel} instantly with SyntaxShift.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${converter.slug}`,
    },
    openGraph: {
      title: `${title} | SyntaxShift`,
      description,
      url: `https://syntaxshifts.vercel.app/${converter.slug}`,
      type: "website",
      images: [
        {
          url: "/icon.png",
          width: 512,
          height: 512,
          alt: "SyntaxShift logo",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${title} | SyntaxShift`,
      description,
      images: ["/icon.png"],
    },
  };
}

export default async function ConverterPage({ params }: ConverterPageProps) {
  const { converterSlug } = await params;
  const converter = getConverterBySlug(converterSlug);
  if (!converter) notFound();

  return <ConverterShell slug={converterSlug} />;
}
