import { notFound } from "next/navigation";

import { ConverterShell } from "@/components/converter-shell";
import { getConverterBySlug } from "@/lib/converters/registry";

type ConverterPageProps = {
  params: Promise<{ converterSlug: string }>;
};

export default async function ConverterPage({ params }: ConverterPageProps) {
  const { converterSlug } = await params;
  const converter = getConverterBySlug(converterSlug);
  if (!converter) notFound();

  return <ConverterShell slug={converterSlug} />;
}
