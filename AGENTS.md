# @speakai/shared

Shared TypeScript enums, interfaces, constants and small helpers for the Speak AI platform,
published to npm as `@speakai/shared`. The Speak web apps, the API server, the MCP server and the
voice agent services all import it, so a change here reaches every one of them. This repo is
public: keep internal hostnames, credentials, customer data and private links out of every file,
commit and PR.

## Layout

- `src/index.ts`: the root barrel (`@speakai/shared`). It re-exports enums, interfaces, the voice
  domain, `src/utils/`, the LLM registry and the pricing projection.
- `src/enums/` and `src/interfaces/`: one file per platform concept, each re-exported from its
  `index.ts`. Also published as the `./enums` and `./interfaces` sub-paths.
- `src/voice/`: the voice agent domain (enums, interfaces, agent templates, response pace,
  pronunciation, Live models, voice LLM choices and pricing). It is exported from the root only;
  there is no `./voice` sub-path.
- `src/llm/registry.ts`: `MODEL_REGISTRY`, one entry per `LLMModels` value.
  `MODEL_PRICING` (`src/pricing/modelPricing.ts`) and the voice agent LLM lists
  (`src/voice/llm.ts`) are projections of it. Speech-to-speech Live models are a separate list
  in `src/voice/liveModels.ts`.
- `src/schemas/`: zod schemas (the dashboard spec). Published only as the `./schemas` sub-path.
- `src/utils/`: transcript and dashboard-spec helpers. `dashboard-spec.ts` must stay free of zod.
- `tests/`: Vitest suites. `dist/` is the build output and is git-ignored.

## Commands

CI uses Node 22 and runs `npm ci --ignore-scripts`, `npm run build` and `npm test` on Ubuntu and
Windows for every PR to `main` and every push to another branch (`.github/workflows/ci.yml`).

- `npm run build`: `tsc`, from `src/` into `dist/`. There is no separate type-check script; the
  build is the type check.
- `npm test`: Vitest, single run. Run `npm run build` first, because
  `tests/dist-exports.test.ts` checks the built `dist/` that consumers actually load.
- `npm run watch`: `tsc --watch`. `npm run clean`: deletes `dist/`.
- `npx vitest run --coverage`: coverage with the thresholds in `vitest.config.ts`
  (`src/interfaces/` is excluded because it has no runtime code).

Run `npm run build && npm test` before you say a change is done.

## Rules that differ from a default TypeScript package

- The package is ESM (`"type": "module"`, `nodenext` resolution), so relative imports in `src/`
  end in `.js` (`from './media.js'`), even though the source file is `.ts`. `tsc` rejects a
  relative import without it, and Node needs it to find the built file.
- Nothing reachable from `src/index.ts` may import `zod`. At least one consumer imports runtime
  enums from the package root while pinning zod v3, and a zod v4 import in the root graph would
  put both versions in its bundle. Import schemas from `@speakai/shared/schemas`.
  `tests/no-zod-in-root-barrel.test.ts` enforces this by walking the built import graph.
- Everything in `src/voice/` shares the root namespace with the platform types. When a voice type
  overlaps a platform concept, give it a `Voice` prefix (`VoiceIntegrationAuthType`) so both can
  be exported side by side.
- To add or change an LLM model, edit `MODEL_REGISTRY` and the `LLMModels` enum together. Do not
  add model data to `MODEL_PRICING` or the voice agent LLM lists directly, because they are
  derived from the registry. `tests/llm-registry.test.ts` fails when an enum value has no registry entry.
- Some values are contracts other repos store or deep-link: agent template ids, response pace
  names and pronunciation limits. Tests pin them exactly (`tests/agent-templates.test.ts`,
  `tests/response-pace.test.ts`, `tests/pronunciation.test.ts`). Do not rename or renumber them
  to make a test pass; add new values instead.
- Removing or renaming an export, an enum value or an interface field breaks consuming apps at
  compile time or, for enum values stored in a database, at run time. Prefer adding over
  changing, and call out any removal in the PR description.
- When you add an export, assert it in `tests/exports.test.ts` (or in `tests/dist-exports.test.ts`
  for a sub-path), because a missing re-export otherwise reaches npm unnoticed.
- Tests also run on Windows, so build file paths with `node:path` and `fileURLToPath`, not by
  joining strings with `/`.

## Code

- Comments: one line that explains why, not what. Use a longer comment only when the logic is genuinely complex. The comment-guard hook flags multi-line comments.
- `zod` is the only runtime dependency. Add another only when a consumer cannot do without it,
  because every app that installs this package pulls it in.

## Releases

Every merge to `main` runs `.github/workflows/publish.yml`. After the build and tests pass on
Ubuntu and Windows, a GitHub Models call reads the commit subjects since the last `v*` tag and
picks the bump: `feat:` or a new type means minor, `BREAKING CHANGE` or a removed export means
major, and everything else, including `chore:` and `docs:`, means patch. The workflow never skips
a release: if the call fails or returns nothing usable, it releases a patch. It then bumps
`package.json`, prepends to `CHANGELOG.md`, commits `chore: release vX.Y.Z [skip ci]`, tags, and
publishes to npm and to GitHub Packages.

- Every merge publishes a new version, even a docs-only one, so group related changes in one PR.
- Use conventional commit subjects, and use `feat:` only for a real new export, enum value or
  field, because it decides the version consumers see.
- Leave the version in `package.json` and `CHANGELOG.md` alone; the release job owns them.
- Dependabot opens PRs for major updates only (`.github/dependabot.yml`).

## Pull requests

- Open every PR as a draft (`gh pr create --draft`, or `draft: true` with the GitHub MCP tool),
  because a human previews each PR before anything merges and a merge here publishes to npm.
  `.github/workflows/draft-pr-guard.yml` turns a PR opened as ready back into a draft. The
  developer marks it Ready; you may do so when the developer asks, after confirming with them. A
  human merges.
- Ask before any action that is shared or hard to undo: pushing to `main`, deleting branches or
  tags, publishing, or changing workflows.
- Do not commit credentials, `.env` files or an `.npmrc` with a token. Stage files by explicit
  path.

## Agent guardrails

Three hooks guard every agent session. `pr-gate.sh` blocks non-draft PR creation and merges;
`block-secrets.sh` blocks writes that contain a credential; `comment-guard.sh` runs after an edit
and flags new multi-line code comments without undoing the edit. Claude Code runs them from
`.claude/settings.json`, and there `pr-gate.sh` asks before a PR is marked Ready. Codex runs them
from `.codex/hooks.json`, with `.codex/rules/` as a backstop. A Codex hook cannot pause to ask, so
under Codex marking a PR Ready is always blocked: ask the developer to do it. The hooks live in
`.claude/hooks/ai-skills/eng-safety/` and are vendored from Speak's shared ai-skills repo, so
change them there rather than here. The plugin list is in `.claude/ai-skills.config`; this repo
has no synced skills, only the hooks and rules.

## Claude Code and Codex

Codex reads this file and skills in `.agents/skills/`. Claude Code reads `CLAUDE.md`, which only
imports this file, and skills in `.claude/skills/`. This repo has no repo-local skills today; if
one is added under `.claude/skills/`, the ai-skills installer links it into `.agents/skills/`.
After pulling, Codex users trust the project once and approve its hooks in `/hooks` (Codex 0.142 or
newer); Codex asks again whenever a hook changes.
