# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Node version

This project requires Node 22. The system default may be older — always prefix commands with:

```bash
export PATH="/Users/patrickcastro/.nvm/versions/node/v22.13.0/bin:$PATH"
```

Or run `nvm use` inside the repo (`.nvmrc` pins to 22).

## Commands

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # type-check + Vite production build
npm run lint     # ESLint
npm run preview  # serve the production build locally
```

Type-check only (no emit):

```bash
npx tsc -p tsconfig.app.json --noEmit
```

## Architecture

Single-page Vite + React 19 + TypeScript app. No backend — data storage is intentionally deferred.

**Routing:** `src/App.tsx` sets up `BrowserRouter`. Add new routes there and create corresponding page components in `src/pages/`.

**Forms:** All forms use `react-hook-form` with `zodResolver`. Define the Zod schema in `src/schemas/`, then wire it to `useForm` in the page component. Use the Shadcn `<Form>` wrapper components from `src/components/ui/form.tsx` for consistent validation display.

**UI components:** Shadcn (radix-nova style, neutral base color) lives in `src/components/ui/`. Add new components with `npx shadcn@latest add <component>` — verify the files land in `src/components/ui/`, not a top-level `@/` folder (a known quirk of this setup).

**Path alias:** `@/` maps to `src/`. Use it for all internal imports.

**Styling:** Tailwind CSS v4 via `@tailwindcss/vite`. Theme tokens and CSS variables are defined at the top of `src/index.css`. No `tailwind.config.js` — configuration lives in the CSS file.

**Static data:** Placeholder/seed data lives in `src/data/` (e.g. `names.ts`). Replace with API calls when the backend is added.