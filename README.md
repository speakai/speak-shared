# @speakai/shared

Shared TypeScript types, enums, and interfaces for the [Speak AI](https://speakai.co) platform.

[![npm version](https://img.shields.io/npm/v/@speakai/shared)](https://www.npmjs.com/package/@speakai/shared)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

## Install

```sh
npm install @speakai/shared
```

The package is ESM, ships its own `.d.ts` files, and has one runtime dependency, `zod`, which only
the `./schemas` entry uses.

## What's included

- **Enums**: media types and states, assistant types, filters, meeting platforms, webhook events,
  user roles, LLM models and providers, and more (`src/enums/`).
- **Interfaces**: API responses, media, prompts, transcripts, folders, meetings, recorders,
  webhooks, dashboards, and more (`src/interfaces/`).
- **Voice agent domain**: enums, interfaces, agent templates, response pace presets,
  pronunciation limits, Live (speech-to-speech) models, voice LLM choices and voice pricing
  (`src/voice/`).
- **LLM model registry**: `MODEL_REGISTRY`, with one entry per model, and `MODEL_PRICING`, which
  is derived from it (`src/llm/`, `src/pricing/`).
- **Helpers**: transcript and dashboard-spec utilities (`src/utils/`).
- **Schemas**: zod schemas for the dashboard spec (`src/schemas/`).

Full types are available via your IDE's autocomplete after installing.

## Entry points

| Import | Contents |
|---|---|
| `@speakai/shared` | Everything except the zod schemas: enums, interfaces, the voice domain, the LLM registry, pricing and helpers |
| `@speakai/shared/enums` | Platform enums only |
| `@speakai/shared/interfaces` | Platform interfaces only |
| `@speakai/shared/schemas` | The zod schemas for the dashboard spec |

```ts
import { MediaType, MODEL_REGISTRY } from "@speakai/shared";
import { dashboardSpecSchema } from "@speakai/shared/schemas";
```

The root entry never imports `zod`, so an app that pins a different zod major can still import
runtime enums from it. Import schemas from `@speakai/shared/schemas`.

## Development

Prerequisites: Node 22 (the version CI uses) and npm.

```sh
npm ci
npm run build   # tsc, from src/ into dist/; this is also the type check
npm test        # Vitest, single run
```

Run `npm run build` before `npm test`, because some suites check the built `dist/` that consumers
load. Other scripts: `npm run watch` (`tsc --watch`) and `npm run clean` (deletes `dist/`).
`npx vitest run --coverage` reports coverage against the thresholds in `vitest.config.ts`.

No environment variables are needed to build or test.

## CI and releases

- `.github/workflows/ci.yml` builds, checks that `dist/index.js` imports as ESM, and runs the tests
  on Ubuntu and Windows for every pull request to `main` and every push to another branch.
- `.github/workflows/publish.yml` runs on every merge to `main`. It runs the same checks, lets a
  GitHub Models call pick the version bump from the commit subjects since the last tag (`feat:`
  is minor, a breaking change is major, anything else is patch), updates `package.json` and
  `CHANGELOG.md`, tags the release, and publishes to npm (using the `NPM_TOKEN` secret) and to
  GitHub Packages. It always releases at least a patch, so every merge publishes a new version.
- `.github/workflows/draft-pr-guard.yml` turns a pull request opened as ready for review back into
  a draft. It needs the `DRAFT_GUARD_TOKEN` secret; without it, it comments and fails its check.
- Dependabot (`.github/dependabot.yml`) opens pull requests for major npm and GitHub Actions
  updates only.

Do not edit the version in `package.json` or `CHANGELOG.md` by hand; the release job owns both.

## Contributing

Work on a branch and open every pull request as a draft, for example with
`gh pr create --draft`, so a person reviews it before it can merge. The author marks it ready for
review once CI passes, and a person merges it. Use conventional commit subjects, because they
decide the next version number.

## Instructions for AI coding agents

Agent instructions live in `AGENTS.md`, and Claude Code, Codex, Cursor and GitHub Copilot all use
it. Codex reads `AGENTS.md` directly. Claude Code reads `CLAUDE.md`, which only imports
`AGENTS.md`, so edit `AGENTS.md`. The guard hooks in `.claude/hooks/ai-skills/` run in Claude Code
(wired in `.claude/settings.json`) and in Codex (wired in `.codex/hooks.json`, with
`.codex/rules/` as a backstop). They block a pull request that is not a draft, block merges, block
writes that contain a credential, flag multi-line code comments and flag weak new tests. In Codex
(version 0.142 or newer), trust the project once and approve its hooks in `/hooks`. `AGENTS.md`
also holds the shared team rules; to propose a new one, run `/add-rule` in Claude Code or
`$add-rule` in Codex. The hooks, the rules and the `add-rule` skill are copied from Speak's shared
ai-skills repo, and `.claude/ai-skills.config` lists the plugins in use and this repo's id. This
repo has no agent skills of its own.

## Related

- [@speakai/mcp-server](https://github.com/speakai/speakai-mcp) — MCP Server & CLI for Speak AI
- [Speak AI](https://speakai.co) — Transcription, analysis, and media intelligence platform

## License

MIT
