import { redirect } from "next/navigation";

import { defaultConverterSlug } from "@/lib/converters/registry";

export default function HomePage() {
  redirect(`/${defaultConverterSlug}`);
}
