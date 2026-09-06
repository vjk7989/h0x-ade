# Rebrand codebase map

Status: initial map only. Do not treat this as approval to rebrand yet.

Last updated: 2026-09-06.

Target fork/release repository: <https://github.com/vjk7989/h0x-ade>.

## Purpose

This map exists so future agents can find the right area before changing it. The intended program is:

1. Surface rebrand: visible names, links, images, docs, and metadata with low runtime risk.
2. Core rebrand: app identifiers, CLI names, storage paths, protocols, IPC/RPC labels, installer/update identity, and migrations.
3. Features: new product behavior after the identity boundary is understood and stable.

Use YAGNI. Change only the slice requested by the user, verify it, then continue.

## Indexed Graph

The local code graph was indexed with `codebase-memory-mcp` for project `orca`.

- Nodes: 123742
- Edges: 491236
- Main languages: TypeScript, YAML, Swift, HCL, Bash, HTML, Ruby, Kotlin, CSS, Python
- Largest packages: `main`, `renderer`, `shared`, `relay`, `preload`, `cli`
- Persistent graph artifact: `.codebase-memory/graph.db.zst` near 30 MB

Prefer graph tools for discovery:

- `search_graph`: find symbols, classes, routes, variables
- `trace_path`: callers, callees, and data flow
- `get_code_snippet`: exact source after `search_graph`
- `query_graph`: cross-cutting Cypher queries
- `get_architecture`: high-level package and boundary summary

Use literal search only for strings, configs, docs, manifests, icons, and workflow metadata.

## Architecture Overview

Top-level areas:

- `src/main`: Electron main process, runtime services, app lifecycle, updater, daemon, local/remote execution, SSH/WSL/Git handling, mobile pairing server, native bridge orchestration.
- `src/renderer/src`: React renderer UI, app shell, tabs, terminal panes, sidebars, settings, source-control UI, browser panes, localization usage, visual branding surfaces.
- `src/preload`: Electron preload bridges that expose typed APIs from main to renderer.
- `src/shared`: shared contracts, schemas, IDs, release-channel logic, CLI command-name helpers, path and platform utilities.
- `src/cli`: packaged CLI entry points and commands, including headless `serve` and orchestration behavior.
- `src/relay`: relay/runtime transport support used by remote or paired flows.
- `cloud`: relay cloud services, operations workflows, Terraform, and cloud package workspace.
- `mobile`: Expo mobile companion app and mobile transport/client UI.
- `native`: platform-native helpers for computer use and Windows CLI launcher.
- `resources`: product icons, app icons, packaged scripts, tray assets, bundled skills/plugins, notification sounds, onboarding media.
- `config`: build, release, lint, typecheck, packaging, localization, and verification scripts.
- `.github`: CI, release, signing, mobile release, cloud deploy, and safety workflows.
- `Casks`: Homebrew cask definitions.
- `docs`: tracked public/reference docs plus ignored local planning docs.
- `tests`: Playwright and tool-level tests; most unit tests sit beside source files.

Current graph boundary signals:

- `renderer -> shared`: heavy shared type and utility consumption.
- `main -> shared`: runtime and host logic depends on common contracts.
- `main -> relay`: remote and relay-backed execution.
- `cli -> shared`: command/runtime contracts.
- `relay -> shared`: transport contracts.
- `main -> renderer`: window/UI integration and event publication.

## Rebrand Risk Tiers

### Surface Rebrand

Start here when the user asks for the first visible pass.

- `README.md`: hero copy, badges, download links, GitHub links, onorca docs links, screenshots/alt text, install commands.
- `package.json`: `description`, `homepage`, `author`; leave `name` and `bin` for a deliberate package/CLI pass.
- `mobile/app.json`: display `name`, permission strings, icons/splash references; leave `slug`, `scheme`, package IDs for core pass.
- `src/renderer/src`: user-visible strings such as settings headings, onboarding copy, toast text, dialogs, menu labels, and "Open in Orca" labels.
- `src/renderer/src/i18n`: generated/runtime localization catalogs; update through existing localization scripts rather than hand-editing generated catalogs unless the local workflow requires it.
- `resources/icon.png`, `resources/build/icon.*`, `resources/app-icons/*`, `resources/tray/*`, `resources/icon-source/*`: icon and tray brand assets.
- `docs/readme`, `docs/assets`, `docs/site`: public docs and website content.
- `Casks/*.rb`: visible Homebrew names/homepages only if release artifacts are already renamed in the same slice.

Surface-pass test focus:

- `pnpm run check:code-quality:changed`
- `pnpm tc`
- targeted renderer or config tests for changed files
- for visible UI, use `$electron` plus Playwright CDP with `ORCA_BACKGROUND_LAUNCH=1`

### Core Rebrand

Do this only after the user explicitly starts the core stage. These names can affect compatibility, migrations, updates, or existing installations.

- `config/electron-builder.config.cjs`: `appId`, `productName`, protocols, executable names, artifact names, Linux package names, maintainer, GitHub publish owner/repo.
- `config/dev-app-update.yml`: dev updater owner/repo/cache identity.
- `config/nsis/orca-installer-hooks.nsh`: Windows installer hooks and file associations.
- `resources/darwin/bin/orca`, `resources/linux/bin/orca-ide`, `resources/win32/bin/orca.cmd`: packaged CLI launchers.
- `native/windows-cli-launcher/OrcaCliLauncher.cs`: Windows launcher executable expectations and environment handoff.
- `src/shared/orca-cli-command-name.ts`: platform-specific CLI command names.
- `src/main/cli`: AppImage, Linux launcher, CLI installation, packaged CLI registration.
- `src/main/updater*` and `src/main/updater/*`: update channels, release feeds, download/install behavior, nudges, fallback behavior.
- `src/shared/release-channel.ts` and updater shared types: release-channel contracts.
- `src/main/runtime` and `src/main/runtime/rpc`: runtime service, RPC names, terminal/worktree/session behavior.
- `src/main/daemon`: daemon startup, shell wrappers, readiness markers.
- `src/renderer/src/constants/terminal.ts`: custom DOM/event names such as `orca-*`.
- `src/shared/orca-yaml*` and root `orca.yaml`: project setup hook config naming.
- `src/shared/orca-profiles.ts`, `src/main/*orca-profile*`, `src/renderer/src/*orca-profile*`: account/profile naming.
- `mobile/app.json`: `slug`, `scheme`, iOS `bundleIdentifier`, Android `package`.
- `cloud` and `.github/workflows/cloud-*`: relay origins, cloud project names, image repositories, production operations.
- `Casks/*.rb`: cask token, app path, binary path, zap paths, download URL, verification URL.

Core-pass compatibility checks:

- Read `docs/reference/remote-wire-compatibility.md` before changing anything crossing client/host boundaries.
- Read `docs/reference/ssh-execution-boundary.md` before changing remote process, terminal, or status behavior.
- Read `docs/reference/git-compatibility.md` before changing Git commands.
- Read `docs/reference/windows-setup-shell.md`, `docs/reference/windows-process-enumeration.md`, and `docs/reference/windows-edr-posture.md` before touching Windows launch/setup/process code.
- Keep old identifiers as accepted aliases where existing users, paired clients, saved state, updater feeds, or installed CLIs may still emit them.

Core-pass test focus:

- `pnpm tc`
- package/config tests near `config/scripts/*electron-builder*`
- updater tests under `src/main/updater*` and `src/main/updater/*`
- CLI tests under `src/main/cli` and `src/cli`
- runtime RPC tests for any protocol/session name changes
- platform-specific packaging smoke tests only for the touched platform

### Feature Stage

Only begin after the current rebrand slice is verified. Likely feature areas:

- Agent/task orchestration: `src/main/runtime/orchestration`, `src/renderer/src/lib/agent-*`, `src/renderer/src/components/sidebar`.
- Terminal UX: `src/renderer/src/components/terminal-pane`, `src/main/daemon`, `src/main/runtime/rpc/methods/terminal`.
- Source control/review: `src/main/github`, `src/main/gitlab`, `src/renderer/src/components/right-sidebar`, `src/renderer/src/components/sidebar`.
- Browser/design mode: `src/main/browser`, `src/renderer/src/components/browser-pane`.
- Mobile companion: `mobile`, `src/main/runtime/rpc/mobile-*`, `cloud/packages/relay-contract`.
- Skills/plugins: `src/main/skills`, `resources/skills`, `resources/plugins/launch`, `skill-guides`, `skill-stubs`.
- Settings/accounts: `src/renderer/src/components/settings`, `src/main/codex-accounts`, `src/main/claude-accounts`, `src/shared/orca-profiles.ts`.

## GitHub And Release Map

Current local remotes:

- `origin`: `https://github.com/vjk7989/h0x-ade.git`
- `upstream`: `https://github.com/stablyai/orca.git`

Intended target:

- `https://github.com/vjk7989/h0x-ade`

Implementation update: the app repo targets `vjk7989/h0x-ade` in local release
metadata and Git remotes. Keep upstream Orca available separately for pulling
source updates.

Release touchpoints:

- `.github/workflows/release-cut.yml`
- `.github/workflows/release-policy.yml`
- `.github/workflows/release-ref-validation.yml`
- `.github/workflows/release-mac-build.yml`
- `.github/workflows/windows-signing-rehearsal.yml`
- `.github/workflows/win-update-*.yml`
- `.github/workflows/mobile-*-release.yml`
- `config/scripts/create-draft-release.mjs`
- `config/scripts/publish-complete-draft-releases.mjs`
- `config/scripts/latest-stable-release.mjs`
- `config/scripts/verify-release-required-assets.mjs`
- `config/electron-builder.config.cjs`
- `config/dev-app-update.yml`
- `Casks/h0x.rb`
- `Casks/h0x@rc.rb`

## Implementation Pass 1 Notes

Changed areas:

- Product identity: `package.json`, `config/electron-builder.config.cjs`,
  `config/dev-app-update.yml`, `mobile/app.json`.
- CLI launcher files: `resources/darwin/bin/h0x`, `resources/linux/bin/h0x`,
  `resources/win32/bin/h0x.cmd`, `config/scripts/h0x-dev`,
  `config/scripts/h0x-dev.mjs`.
- CLI command helpers and orchestration preambles:
  `src/shared/orca-cli-command-name.ts`,
  `src/main/runtime/orchestration/cli-command.ts`,
  `src/main/runtime/orchestration/preamble.ts`.
- Mobile/web pairing scheme:
  `src/shared/pairing.ts`, `mobile/src/transport/pairing.ts`,
  `src/renderer/src/web/web-pairing.ts`.
- Release helpers:
  `src/shared/release-channel.ts`, `config/scripts/create-draft-release.mjs`,
  `config/scripts/latest-stable-release.mjs`,
  `config/scripts/verify-release-required-assets.mjs`.
- Logo PNG assets regenerated from `the-logoo.png.png`; Windows `.ico`
  regeneration is still blocked until project dependencies are installed.
- Website repo was cloned to ignored path `external-checkouts/fluffy-lamp`.

Intentional temporary internal names:

- Several `ORCA_*` environment variables remain unchanged so existing scripts and
  runtime handoff stay compatible during this surface/core pass.
- Some internal symbol/file names still contain `Orca`/`orca` where renaming would
  be a broad API refactor rather than visible branding.

## Discovery Recipes

Use these before editing a slice:

- Find package-level architecture:
  `get_architecture(project="orca", aspects=["overview","boundaries","packages","layers"])`
- Find a symbol:
  `search_graph(project="orca", query="<plain English or symbol words>")`
- Find exact class/function:
  `search_graph(project="orca", name_pattern=".*Name.*")`
- Read exact implementation:
  `get_code_snippet(project="orca", qualified_name="<qualified_name from search_graph>")`
- Trace callers/callees:
  `trace_path(project="orca", function_name="<function>", direction="both", depth=2)`
- Search literal brand/config text:
  use `rg` with targeted paths and exclusions; avoid broad whole-repo brand scans because `orca` appears in many runtime identifiers and tests.

## Do Not Bulk-Rename

Never run a repo-wide replace of `orca`, `Orca`, `ORCA`, `stablyai`, or `onorca`.

Reasons:

- Some occurrences are public compatibility contracts.
- Some are generated test fixtures.
- Some are package, CLI, protocol, storage, updater, or mobile deep-link identifiers.
- Some are examples using upstream URLs.
- Some are runtime event names where old/new clients may coexist.

For each rebrand task, classify every target as one of:

- display-only
- metadata-only
- package/release identity
- CLI or executable identity
- protocol or deep-link identity
- storage/migration identity
- test fixture only
- generated artifact

Then change only the requested class.

## Current Local Artifacts

Existing local context docs from the first planning pass:

- `docs/rebrand-architecture-record.md`
- `docs/rebrand-handoff-template.md`

Those files are currently local planning docs unless separately allow-listed. This map is allow-listed because it is intended as the durable starting point for future rebrand work.

## Implementation Pass 2 Notes

Additional changed areas:

- CLI help/spec surfaces now use `h0x` across `src/cli/specs/`, including
  orchestration, terminal/worktree/repo, Linear, computer-use, environment,
  browser, and skills command examples.
- Bundled skill guidance source and generated artifacts now direct agents to
  `h0x`/`h0x-dev`: `skill-guides/`, `skill-stubs/`, `skills/`, and
  `src/cli/bundled-skill-guides.ts`. The `ORCA` placeholder remains in guide
  examples because the guides define it as a documentation placeholder to be
  substituted with the resolved executable.
- Runtime PTY/SSH/Command Code command exports now use `h0x` or `h0x-dev`:
  `src/main/ipc/pty/host-env/assembly.ts`,
  `src/main/pty/codex-shell-launch-preflight.ts`,
  `src/main/ssh/ssh-remote-cli-launcher.ts`,
  `src/main/command-code/command-code-managed-script.ts`.
- Installed Electron discovery now looks for h0x-ADE app/binary names in
  `src/main/orcad/orcad-browser-provider.ts`.
- Linux packaging/headless smoke helpers now assert `resources/bin/h0x` and
  extracted root `h0x` launchers.
- Dev helper logs/userData/marker names now use `h0x-dev` and
  `h0x-dev-electron-app.json`.

Test status for this pass:

- Guidance/spec gate passed: 9 test files, 136 passed, 2 skipped.
- PTY/SSH/startup/helper gate passed: 12 test files, 160 passed, 19 skipped.
- Dev launcher/config gate passed: 6 test files, 86 passed, 4 skipped.
- Combined focused gate passed: 48 test files, 608 passed, 88 skipped.
- Final focused subset after typecheck fixes passed: 3 test files, 69 passed.
- Direct typecheck passed with
  `node config/scripts/run-typecheck-projects-in-parallel.mjs`.
- Changed-code quality passed since `fd10758eae98`: 0 new ordinary,
  type-aware, or React Doctor findings across 204 changed files.
- `pnpm tc` is blocked by the local Corepack pnpm shim looking for missing
  `D:\Caches\node\corepack\v1\pnpm\12.0.0\bin\pnpm.cjs`; use the direct
  typecheck command above until the local pnpm shim is repaired.

Known remaining old-name buckets:

- Redirect/backlink inventory is intentionally still old in README/mobile App
  Store/docs links until final URL mapping is provided.
- Internal compatibility identifiers and environment variables such as `ORCA_*`
  remain staged.
- Some historical or legacy test fixtures still mention old package names,
  updater files, old pairing schemes, and upstream issue URLs; update only when
  their runtime surface is part of a later task or their tests are moved into a
  required gate.

## Remaining Rebrand Pass Notes

Status: local app gates passed; website build, mac icon regeneration, and final
release smoke checks remain blocked or staged.

### Decisions

- Local tooling repair comes first because Git hooks and normal verification must
  run through `pnpm`, not only fallback Node commands.
- Public GitHub release links may move to `vjk7989/h0x-ade` now. Website, docs,
  privacy, telemetry, store, TestFlight, Discord, and social links stay
  unchanged until final destinations are provided. Android APK GitHub release
  downloads point at `vjk7989/h0x-ade` because they use the release-download
  bucket.
- Release asset filenames use the short `h0x-*` names. Do not invent release
  assets or update Homebrew checksums until real assets exist.
- `ORCA_*` environment variables and other compatibility identifiers remain in
  place unless a later task adds migration or legacy-acceptance tests.
- `.codebase-memory/` is local generated context and remains untracked.

### Changed Areas In Current Diff

- Tooling repair was done in the local Corepack cache outside the repo by adding
  missing `pnpm.cjs` and `pnpx.cjs` shims under
  `D:\Caches\node\corepack\v1\pnpm\12.0.0\bin`. This repaired `pnpm --version`
  and normal `pnpm tc` execution.
- Release and CI metadata now points at `https://github.com/vjk7989/h0x-ade` and
  short desktop artifacts in `.github/workflows/*`, especially release cut,
  mac build, Windows signing, Windows update survival, dev-channel, PR, and
  Homebrew bump workflows.
- CI build job repository guards now allow `vjk7989/h0x-ade`, and dev-channel
  mac/Windows build workflows publish to `vjk7989/h0x-hourly`,
  `vjk7989/h0x-daily`, and `vjk7989/h0x-adhoc`.
- macOS CI build workflows use GitHub-hosted `macos-15` runners in this fork so
  ad-hoc/dev/release mac builds can be scheduled without Blacksmith runners.
- GitHub Actions ad-hoc build was dispatched for commit
  `5d49d0056ab22c51104e07d555c4fec616392405`, but run
  `https://github.com/vjk7989/h0x-ade/actions/runs/34051838270` failed before
  steps started because the private repo/account cannot start paid Actions
  runners until billing or spending limit is fixed.
- Updater feed/runtime paths changed in `src/main/updater-prerelease-feed.ts`,
  `src/main/updater/updater-release-feed.ts`, and
  `src/main/updater/updater-setup.ts`, with related updater tests updated to the
  new repo and `h0x-*` asset names. Prerelease asset readiness still accepts old
  `stablyai/orca` absolute release-asset URLs for compatibility.
- CLI public command text and examples were moved toward `h0x` across
  `src/cli/specs/`, `src/cli/help.ts`, `src/cli/root-help-text-primary.ts`,
  format/recovery helpers, handlers, selector text, launch diagnostics, and many
  adjacent CLI tests.
- Orchestration recovery currently normalizes recovered `orca` or `orca-ide`
  command argv to the resolved h0x executable in
  `src/cli/orchestration-mutation-recovery.ts`.
- Bundled skill guidance was regenerated after updating source guides in
  `skill-guides/`, `skill-stubs/`, and `skills/`; generated output is
  `src/cli/bundled-skill-guides.ts`.
- Public install/readme surfaces changed in `README.md`,
  `docs/readme/README.*.md`, `docs/site/content/docs/install.mdx`,
  `docs/reference/headless-linux-server.md`, and renderer recovery/download UI.
- Mobile protocol-block and renderer mobile APK download surfaces now point to
  the h0x-ADE release repository while App Store/TestFlight links remain
  unchanged.
- Local build, single-instance, release-channel, and Windows signature-check tests
  were updated where they asserted old artifact or app names.
- Website work is in the ignored checkout
  `external-checkouts/fluffy-lamp`: a `h0x-ADE` product page, docs pages, sidebar
  entry, and copied logo were added there. This is intentionally outside the main
  app diff.

### Verification So Far

- `pnpm --version` now reports `12.0.0`.
- `pnpm tc` passed after the Corepack shim repair.
- `pnpm run check:code-quality:changed` passed: 0 new ordinary, type-aware, or
  React Doctor findings across 124 changed files.
- Pre-commit hook dry run passed through the repaired pnpm/Corepack path:
  `pnpm exec lint-staged --allow-empty` reported no staged files.
- Focused release/updater/CLI gate passed:
  `pnpm exec vitest run --config config/vitest.config.ts config/scripts/electron-builder-config.test.mjs config/scripts/verify-release-required-assets.test.mjs src/cli/specs/bundled-guide-flags.test.ts src/cli/runtime/orchestration-recovery-command.test.ts src/main/updater-release-builds.test.ts src/main/updater-prerelease-feed.test.ts src/main/updater-prerelease-feed-readiness.test.ts src/main/updater.build-channel-selection.test.ts src/main/updater.publishing-window-feed.test.ts src/main/updater.check-failure.test.ts`
- Focused CLI recovery/skills/orchestration gate passed: 9 files, 207 passed,
  1 skipped.
- Broad CLI gate passed when excluding the known Windows socket-heavy local
  recovery test:
  `pnpm exec vitest run --config config/vitest.config.ts src/cli --exclude src/cli/runtime/client-recovery.test.ts`
  with 108 files passed, 1029 tests passed, 30 skipped.
- Local build/package/update UI gate passed:
  `pnpm exec vitest run --config config/vitest.config.ts src/main/local-builds/local-build-candidate.test.ts src/main/local-builds/local-build-compatibility-contract.test.ts mobile/src/components/HostProtocolGate.test.ts src/renderer/src/components/UpdateCard.error-card.test.tsx`
  with 3 files passed, 30 tests passed, 1 skipped.
- Additional release/package smoke slice passed:
  `pnpm exec vitest run --config config/vitest.config.ts config/scripts/dev-channel-windows-workflow-contract.test.mjs config/scripts/headless-serve-shutdown-workflow.test.mjs src/main/local-builds/local-build-candidate.test.ts src/main/startup/single-instance-lock.test.ts src/shared/release-channel.test.ts src/shared/updater-windows-signature-check.test.ts src/renderer/src/components/LinuxPackageInstallRecoveryCard.test.tsx`
  with 7 files passed, 111 tests passed, 1 skipped.
- CI workflow target patch passed:
  `pnpm exec vitest run --config config/vitest.config.ts config/scripts/dev-channel-windows-workflow-contract.test.mjs config/scripts/electron-builder-config.test.mjs config/scripts/verify-release-required-assets.test.mjs src/main/updater-release-builds.test.ts src/shared/release-channel.test.ts`
  with 5 files passed, 95 tests passed.
- Public GitHub support/skill-link UI gate passed:
  `pnpm exec vitest run --config config/vitest.config.ts src/renderer/src/components/star-nag/StarNagToastHost.test.tsx src/renderer/src/components/settings/AgentSkillSetupPanel.test.tsx src/renderer/src/components/settings/BrowserUseSkillStep.test.tsx src/renderer/src/components/settings/OrchestrationPane.test.tsx src/renderer/src/components/settings/linear-agent-skill-install-cta.test.tsx src/renderer/src/components/skills/SkillFreshnessUpdateDialog.test.tsx src/renderer/src/components/skills/skill-freshness-skipped-reason.test.ts`
  with 7 files passed, 89 tests passed.

### Current Blockers

- D: drive free space is very low. Website dependency install in
  `external-checkouts/fluffy-lamp` failed with `ERR_PNPM_ENOSPC`; the failed
  `node_modules` was removed, but the website build remains unverified.
- The website repo lockfile is pnpm lockfile v6 and should be installed with a
  pnpm 8 command, for example `corepack pnpm@8.15.9 --ignore-workspace install
  --frozen-lockfile`, after enough D: space is available.
- `resources/build/icon.icns` still needs macOS or CI tooling to regenerate from
  the h0x-ADE logo.
- Full `src/cli` without exclusions is still not a reliable Windows gate because
  `src/cli/runtime/client-recovery.test.ts` can fail with local socket `EACCES`.
- Do not tag or release until final release-asset verification, platform
  packaging smoke checks, Electron UI validation, website verification, and mac
  icon regeneration are complete.
- CI/CD builds are currently blocked by GitHub billing/spending-limit status on
  `vjk7989/h0x-ade`; rerun the ad-hoc build after fixing billing.

### Resume Map For Future Agents

- Tooling: verify with `pnpm --version`, `pnpm tc`, and
  `pnpm run check:code-quality:changed`.
- Link inventory: keep using
  `docs/reference/rebrand-link-redirection-notes.md` as the checklist; do not
  rewrite unresolved website/docs/store/community destinations.
- Release identity: inspect `.github/workflows/`, `config/scripts/`,
  `config/electron-builder.config.cjs`, `src/main/updater*`,
  `src/main/updater/`, `src/shared/release-channel.ts`, and `Casks/`.
- CLI identity: inspect `src/shared/orca-cli-command-name.ts`,
  `src/cli/specs/`, `src/cli/format.ts`, `src/cli/computer-format.ts`,
  `src/cli/orchestration-mutation-recovery.ts`, `src/cli/handlers/`, and
  generated `src/cli/bundled-skill-guides.ts`.
- Website/docs: work only in
  `external-checkouts/fluffy-lamp`; keep it ignored by the main app repo.
- Internal migration later: classify remaining names before editing:
  `ORCA_*`, storage files, updater state, protocol/deep-link names, installed CLI
  paths, plugin IDs, relay/cloud names, and historical fixtures.
