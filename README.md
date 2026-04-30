# HupSup POS

ระบบ POS ครบเครื่องสำหรับร้านเล็กในลาว — ใช้งานออฟไลน์ได้ รับ LAK + THB ในบิลเดียว
ครอบคลุมร้านค้าทั่วไป ร้านอาหาร และร้านบริการ ในระบบเดียว

A self-hostable POS for small shops in Laos. Works offline. Accepts LAK + THB in
a single bill. Supports retail, restaurant, and service verticals from one
codebase.

> 🚧 **Status:** Sprint 0 — foundation (auth, db, i18n, shell). Sales / inventory /
> reports modules are coming next.

---

## Tech stack

| Layer            | Choice                                               |
| ---------------- | ---------------------------------------------------- |
| App framework    | Next.js 16 (App Router) + TypeScript + Tailwind v4   |
| Database         | PostgreSQL 16 (self-hosted via Docker)               |
| ORM / migrations | Drizzle ORM + drizzle-kit                            |
| Auth             | Auth.js v5 (Credentials provider, JWT sessions)      |
| i18n             | next-intl (Thai · Lao · English)                     |
| UI               | shadcn/ui (added per-component on demand)            |
| Tooling          | ESLint, Prettier, Husky, lint-staged, GitHub Actions |

Everything is designed to run on a single VPS with Docker — no paid SaaS
dependencies.

---

## Quick start (local dev)

Prereqs: Node.js 22, pnpm 9, Docker.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure env
cp .env.example .env
# (edit .env if you want to change DB credentials or AUTH_SECRET)

# 3. Start Postgres
pnpm db:up

# 4. Apply migrations
pnpm db:migrate

# 5. Run the app
pnpm dev
```

App runs on http://localhost:3000 — defaults to Thai. Switch to Lao or English
via the language picker in the header.

### Useful scripts

| Script             | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Run Next.js dev server                       |
| `pnpm build`       | Production build                             |
| `pnpm start`       | Run production build                         |
| `pnpm lint`        | ESLint                                       |
| `pnpm format`      | Prettier (write)                             |
| `pnpm typecheck`   | `tsc --noEmit`                               |
| `pnpm db:up`       | Start the dev Postgres container             |
| `pnpm db:down`     | Stop the dev Postgres container              |
| `pnpm db:generate` | Generate a new Drizzle migration from schema |
| `pnpm db:migrate`  | Apply pending migrations                     |
| `pnpm db:push`     | Push schema directly (skip migration files)  |
| `pnpm db:studio`   | Open Drizzle Studio                          |

---

## Project layout

```
src/
  app/
    layout.tsx               # Root passthrough (required by Next.js)
    [locale]/
      layout.tsx             # Locale-aware <html>/<body>, font loading
      page.tsx               # Landing page
    api/
      auth/[...nextauth]/    # Auth.js HTTP handlers
  components/
    locale-switcher.tsx
  db/
    schema.ts                # Drizzle table definitions
    index.ts                 # DB client (pooled)
  i18n/
    config.ts                # Locale list + labels
    request.ts               # next-intl server config
    routing.ts               # next-intl routing
    navigation.ts            # Locale-aware Link / useRouter
  lib/
    auth.ts                  # Auth.js v5 setup
  proxy.ts                   # Replaces middleware in Next.js 16

drizzle/                     # Generated SQL migrations (committed)
docker/
  docker-compose.dev.yml     # Dev Postgres
messages/
  th.json | lo.json | en.json
.github/workflows/ci.yml     # Format / lint / typecheck / build
```

---

## Roadmap

| Phase | When        | Scope                                                |
| ----- | ----------- | ---------------------------------------------------- |
| 0     | now         | Auth · i18n · DB · CI · landing                      |
| 1     | weeks 1–10  | Retail POS · catalog · stock · receipts · reports    |
| 2     | months 4–6  | Multi-branch · Restaurant (KDS, tables) · e-receipts |
| 3     | months 7–12 | Service vertical · advanced reports · buyout package |

See the planning docs in `/docs` (uploaded separately to the user) for the full
breakdown.

---

## License

Proprietary — © HupSup. All rights reserved.
