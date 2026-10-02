# travelhues-admin overview

Next.js desk for editing TravelHues stories and platform settings consumed by **travelhues-app** and **travelhues-api**.

## Run

```bash
npm install
npm run dev -- --port 3002
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` if the API is not on port 4000. Authenticate with the API `ADMIN_TOKEN`.

## Code map

| Area | Path |
|------|------|
| Routes | `src/app/` |
| UI | `src/components/` |
| API helpers | `src/lib/` |

## Related

- [ecosystem.md](ecosystem.md)
- [concepts/domain-glossary.md](concepts/domain-glossary.md)
- [SCHEMA.md](SCHEMA.md)
