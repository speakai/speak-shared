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

## Tests

Tests live in the root `tests/` folder (Vitest, default include, not next to the source); run
them with `npm run build && npm test` (see Commands for why the build comes first).

## Pull requests and secrets

- A merge to `main` publishes to npm, so every PR stays a draft until a human has previewed it.
  `.github/workflows/draft-pr-guard.yml` turns a PR opened as ready back into a draft. You may
  mark a PR Ready only when the developer asks, after confirming with them. Under Codex, a hook
  cannot pause to ask, so marking Ready is always blocked: ask the developer to do it.
- Shared or hard to undo here: pushing to `main`, deleting branches or tags, publishing, and
  changing workflows.
- The package reads no secrets at runtime. The release job's npm token comes from the `NPM_TOKEN`
  GitHub Actions secret. Never commit it, an `.npmrc` with a token or a `.env` file. Stage files
  by explicit path.

<!-- BEGIN ai-skills rules: generated from speakai/ai-skills policy/; change with /add-rule or $add-rule, not here -->
## Team rules
**Working style**
- When adding or upgrading a dependency, use the latest stable version and read its current docs.
- Report an error you cannot fix instead of catching and hiding it.
- When asked for a plan, review or answer, give it and edit nothing until the developer says to build.
- Read the code, config or data before stating how something works, say what you checked, and for complex changes try to prove your own conclusion wrong before calling it done.
- Before adding a function, component, hook, script or flow, search this repo and the shared packages for one that already does it and extend that.
- Before starting, list in the plan every repo and surface the request covers (MCP, docs, mobile, shared packages, UI package, Codex config).
- Try the simplest fix first and add a helper, constant, option or layer only when a second real caller exists today.
- Before starting or resuming work in a worktree or branch, fetch and merge the latest base branch (dev, main or master per this repo) so the work starts from current code.
**Code**
- Comments explain why in one line, never what; change history, plan names and old-behavior notes go in the commit or PR.
- Match and join records by ID, never by name or label.
- Put types, enums, interfaces and constants where this repo keeps them (shared package first, then the feature's own file) and never create a file for one value.
- Release shared packages in the order shared, ui, server, client, and after publishing bump and typecheck every consumer.
**Tests**
- Every bug fix gets a test that fails without the fix, placed where this repo's AGENTS.md says tests live (full rules: the testing-policy skill, where installed).
**Pull requests**
- Open every PR as a draft (gh pr create --draft); the developer marks it Ready and a human merges.
- Add follow-up work for a task to that task's open PR in this repo instead of opening a new one.
**Safety**
- Ask before shared or irreversible actions; a step marked "needs a decision" stays undecided even inside an approved plan, and reversibility is proven (backup written, objects confirmed) before relying on it.
- Never hardcode a credential or a fallback for one; read it from the secret source this repo's AGENTS.md names.
- Say plainly what you did not verify; after a UI change open it in a browser, check light and dark mode and the widths this repo lists, and attach a screenshot to the PR.
**Definition of done**
- The branch is pushed and the PR shows the final commit.
- The final message lists every PR link with its state, what was verified and how, and what is left (the gap report).
- The change covers every repo and surface on the plan's scope list, or the PR says why one is skipped.
- Tests ran and the PR shows the command and result; a bug fix has its regression test.
<!-- END ai-skills rules -->

## Claude Code and Codex

Codex reads this file and skills in `.agents/skills/`. Claude Code reads `CLAUDE.md`, which only
imports this file, and skills in `.claude/skills/`. The guardrail hooks, the `add-rule` skill
(`/add-rule` in Claude Code, `$add-rule` in Codex) and the team rules block above are vendored
from Speak's shared ai-skills repo, so change them there rather than here. Re-vendor with that
repo's `scripts/install.sh --target <this repo> --plugins eng-safety`; the plugin list and this
repo's id are in `.claude/ai-skills.config`. After pulling, Codex users trust the project once and
approve its hooks in `/hooks` (Codex 0.142 or newer); Codex asks again whenever a hook changes.
