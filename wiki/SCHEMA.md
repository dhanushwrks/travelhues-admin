# TravelHues LLM Wiki schema

Pattern source: [Karpathy LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (copy in [`../raw/references/llm-wiki-pattern.md`](../raw/references/llm-wiki-pattern.md)).

## Repo scope

**travelhues-admin** — Next.js admin desk on port 3002; edits stories/settings via `travelhues-api` admin routes (`ADMIN_TOKEN`, `NEXT_PUBLIC_API_URL`).

Sibling wikis: `travelhues-app` (main product), `travelhues-api` (backend). See [ecosystem.md](ecosystem.md).

## Layers

| Layer | Path | Who writes |
|-------|------|------------|
| Raw sources | `raw/` | Humans (immutable for agents) |
| Wiki | `wiki/` | LLM maintains; humans review |
| Schema | `wiki/SCHEMA.md` | Humans + LLM co-evolve |
| Agent entry | `AGENTS.md` | Points agents at this wiki |

## Page types

- **overview.md**, **ecosystem.md**, **concepts/**, **modules/**, **sources/**, **decisions/** — same conventions as other TravelHues repos.

## Operations

Ingest, query, and lint per the shared pattern in `travelhues-app/wiki/SCHEMA.md` (ingest → sources page → update concepts/modules → index → log).

## Skill

Use `.cursor/skills/llm-wiki/SKILL.md`.
