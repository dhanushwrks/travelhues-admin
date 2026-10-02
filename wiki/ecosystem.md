# TravelHues ecosystem

Three repositories share product vocabulary and API contracts. Each repo has its own `wiki/`; keep this page aligned across repos when links or ports change.

| Repo | Role | Default local |
|------|------|----------------|
| `travelhues-app` | Consumer/creator Next.js PWA | `npm run dev` |
| `travelhues-api` | NestJS API + Supabase content | `npm run start:dev` → port **4000** |
| `travelhues-admin` | Story/settings admin desk | `npm run dev -- --port 3002` |

Typical checkout layout: sibling folders under the same parent directory.

## Integration

- This desk talks to **travelhues-api** admin routes only.
- Configure `NEXT_PUBLIC_API_URL` in `.env.local` when API is not on port 4000.
- Sign in with the API `ADMIN_TOKEN`.

## Wiki workflow

1. Put immutable inputs in `raw/`.
2. Document admin UX and API usage here; defer domain model details to `travelhues-api` / `travelhues-app` wiki when possible.
