import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Converter not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route exists only for supported SyntaxShift converter slugs.
        </p>
        <Link className="mt-4 inline-block text-sm font-medium text-primary underline" href="/svg-to-jsx">
          Go to default converter
        </Link>
      </div>
    </main>
  );
}
