<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# bucket-list — project rules

A private two-person app: a shared bucket list of trips (*Viaggi*) and challenges
(*Sfide*), plus a blog. Two passwords, one per partner. No accounts, no roles.

## Framework conventions (Next.js 16 — verified against `node_modules/next/dist/docs/`)

- **Proxy, not middleware.** The file is `proxy.ts` at the project root and it
  exports a function named `proxy`. `export const config = { matcher }` still works.
- **Never set `runtime` in `proxy.ts`** — the option is not available in Proxy
  files and setting it throws. Proxy is Node.js by default.
- Proxy is *not* an authorization solution. It guards pages as a convenience;
  every page still calls `requireSession()` and every route handler still calls
  `getSession()`. That redundancy is deliberate — do not "optimise" it away.
- `cookies()` from `next/headers` is **async** — always `await` it.
  `cookieStore.set()` is legal only in Route Handlers and Server Actions,
  **never in a server component**. Login must therefore be a route handler.
- Route handler dynamic params are a **Promise**:
  `{ params }: { params: Promise<{ id: string }> }` -> `await params`.
- `images.remotePatterns` uses the object form; set `search: ''` explicitly.

## Project layout

- `app/` lives at the repo root — **no `src/`**.
- Tailwind CSS v4: all configuration lives in `app/globals.css` via `@theme`.
  There is **no `tailwind.config.js`** and there must never be one.
- `app/lib/auth.ts` imports **nothing** (no `next/*`, no `node:*`) so it is safe
  in the proxy bundle. `app/lib/session.ts` is the only module that touches
  `next/headers`.

## Rules

- **UI copy is Italian.** `<html lang="it">`. Error bodies from the API are
  Italian too.
- **Never trust a client-supplied `author`.** Authorship is always stamped from
  `session.u`, never from the request body.
- **Write files with the Write/Edit tools, never shell redirection.** Italian
  accented characters (`è à ò`) get mangled through PowerShell depending on the
  console codepage.
- `.env` holds two real passwords — `.gitignore` must keep covering `.env*` and
  `.vercel`.
- Keep the `mongoose.models.X || mongoose.model(...)` guard on every model, and
  `serverExternalPackages: ['mongoose']` in `next.config.ts`.
- No bare hex colour literals in components — every colour goes through a
  `@theme` token.
