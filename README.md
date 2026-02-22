# SyntaxShift

Developer-friendly format transformation tool built with Next.js.

Live URL: `https://syntaxshifts.vercel.app/`

## What This Project Does

SyntaxShift converts code/data formats in the browser using a frontend transform engine.

Current converters:
- `SVG -> JSX`
- `HTML -> JSX`
- `JSON -> TypeScript`
- `JSON -> YAML`
- `JSON Schema -> TypeScript`
- `Python -> JavaScript`
- `JavaScript -> Python`
- `Markdown -> HTML`
- `XML -> JSON`
- `YAML -> JSON`

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Vitest (unit tests)
- Parsing libs where appropriate (`js-yaml`, `fast-xml-parser`, `marked`)

## Project Structure

- `app/` - routes, metadata, SEO files (`robots.ts`, `sitemap.ts`)
- `components/` - UI shell, nav, editor panes, settings UI
- `lib/converters/registry.ts` - converter catalog + defaults
- `lib/converters/frontend-engine.ts` - transformation logic
- `tests/` - engine and registry tests

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start local dev server
- `npm run lint` - run ESLint
- `npm run test` - run Vitest
- `npm run build` - production build check
- `npm run start` - start production server

## How Transforms Work

`components/converter-shell.tsx` calls:
- `transformInFrontend(slug, input, settings)` from `lib/converters/frontend-engine.ts`

The engine:
- routes by converter slug
- parses input safely
- returns transformed output or throws a readable error

## Adding a New Converter

1. Add converter metadata in `lib/converters/registry.ts`:
   - `slug`, `title`, `sourceLabel`, `targetLabel`, `category`
   - optional `settings`
2. Add transformation logic in `lib/converters/frontend-engine.ts` switch block.
3. Add default input sample in `getDefaultInput(...)` if needed.
4. Add tests in `tests/engine.test.ts`.
5. Run:

```bash
npm run lint && npm run test && npm run build
```

## SEO

SEO is configured with:
- global metadata in `app/layout.tsx`
- per-converter metadata in `app/[converterSlug]/page.tsx`
- `app/sitemap.ts`
- `app/robots.ts`

After deploy, submit:
- `https://syntaxshifts.vercel.app/sitemap.xml`

to Google Search Console.

## Notes

- Mobile navigation uses a slide-in drawer.
- Icon assets are served from `app/icon.png`.
- The repo may still contain legacy API routes (`app/api/*`), but the converter UI currently runs on frontend transform logic.
