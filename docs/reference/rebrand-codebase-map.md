# Rebrand codebase map

Status: active durable map for the staged rebrand. Each pass still requires its
own verification before release.

Last updated: 2026-09-08.

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
metadata and Git remotes. Treat this as an independent fork: keep upstream Orca
only as a read-only reference, with no automatic merge or rebase policy.

Release touchpoints:

- `.github/workflows/release-cut.yml`
- `.github/workflows/release-policy.yml`
- `.github/workflows/release-ref-validation.yml`
- `.github/workflows/release-mac-build.yml`
- `.github/workflows/unsigned-desktop-build.yml`
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

CI/CD update:

- The repository is public as of 2026-09-07, so GitHub-hosted runner minutes are
  available for build verification.
- The signed ad-hoc/release macOS workflows still require Apple Developer ID and
  notarization secrets: `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
  `APPLE_TEAM_ID`, `CSC_LINK`, and `CSC_KEY_PASSWORD`.
- Use `.github/workflows/unsigned-desktop-build.yml` for manual unsigned
  desktop CI artifacts. It builds h0x Linux x64, Windows x64, and macOS
  x64/arm64 artifacts without Apple or Windows signing secrets.
- Use `.github/workflows/publish-unsigned-desktop-release.yml` to publish the
  artifacts from a successful unsigned build run to `vjk7989/h0x-ade` releases.
  This is the current public distribution path: users download unsigned apps and
  self-sign/clear quarantine on macOS when needed.
- Signed and notarized macOS releases remain optional future polish, not a
  blocker for public unsigned distribution.
- GitHub's current public hosted runner labels used here are `ubuntu-latest`,
  `windows-2022`, `macos-15-intel` for Intel macOS, and `macos-15` for arm64
  macOS.
- CI evidence:
  - Run `34053487927` built and uploaded `h0x-windows-x64-*`,
    `h0x-macos-arm64-*`, and `h0x-macos-x64-*`; its Linux lane failed before
    packaging because the runner lacked the AT-SPI GI namespace.
  - Commit `d9a52a8fad39c4484f1ac0b37dda3959582ea6cb` added the missing Linux
    runtime packages before build inputs.
  - Run `34054072891` passed the Linux-only lane and uploaded
    `h0x-linux-x64-*`.
  - Run `34054395433` passed all unsigned desktop lanes at commit
    `d0bfaf751a68c1e4b3214898185031235f278b01` and uploaded
    `h0x-windows-x64-*`, `h0x-linux-x64-*`, `h0x-macos-x64-*`, and
    `h0x-macos-arm64-*`.
  - Run `34055076344` passed all unsigned desktop lanes at commit
    `a0a48bab375068639702cba12238ef0c40d72022` and uploaded current-tip
    Windows, Linux, macOS x64, and macOS arm64 artifacts.

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
- Orchestration recovery preserves the executable from the recorded original
  command, including legacy `orca`, `orca-dev`, and `orca-ide` identities; only
  commands without a recorded executable use the canonical h0x default.
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
- Do not tag or release until final release-asset verification and unsigned
  platform packaging checks are complete.

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

## Surface Rebrand Completion Pass

Current branch: `codex/finish-surface-rebrand`. Final tested code SHA:
`770cfbc102ecd3eaadcb7c37b9063c81d44450aa`; review:
[PR #1](https://github.com/vjk7989/h0x-ade/pull/1).

### Staged Slices

- Display-only strings are scoped to the landing, onboarding, titlebar,
  settings, sidebar, star-nag, and mobile surfaces already present in the
  current diff. `h0x-ADE` is the display brand and `h0x` remains the CLI name.
- The matching keys in `src/renderer/src/i18n/locales/` now resolve to the
  display brand across English, Spanish, French, Japanese, Korean, and Chinese;
  the runtime-required English catalog is updated with the same boundary.
- `resources/logo.svg` now carries the square, accessible, self-contained asset
  contract consumed by the rebranded renderer surfaces. The contract lives in
  `src/renderer/src/assets/logo-asset-contract.test.ts` rather than duplicating
  the SVG requirements here.
- Six E2E launcher call sites now invoke the existing
  `config/scripts/h0x-dev.mjs`: two in
  `tests/e2e/helpers/computer-cli-driver.ts` and four across the two terminal
  E2E specs in the current diff. This is a deterministic test-launch repair,
  not a CLI compatibility migration.
- New coverage is concentrated in
  `src/renderer/src/i18n/surface-brand-contract.test.ts`,
  `src/renderer/src/assets/logo-asset-contract.test.ts`, and
  `tests/e2e/surface-brand.spec.ts`; adjacent component tests cover the touched
  onboarding, sidebar, mobile, and star-nag surfaces.

### Verification State And Boundary

- In [PR run 34156029407](https://github.com/vjk7989/h0x-ade/actions/runs/34156029407),
  the static-analysis jobs passed changed-code quality and every localization
  check, typecheck passed, and the PR-routed E2E job passed.
- The affected Node 24 shards passed: surface brand 6/6, logo 2/2, onboarding
  18/18, sidebar 23/23, MobileHero 15/15, MobilePageToolbar 2/2,
  WindowsFirewallNotice 7/7, and StarNag 7/7.
- Scoped background renderer and `h0x-dev.mjs` launcher validation passed in
  [run 34156043129](https://github.com/vjk7989/h0x-ade/actions/runs/34156043129).
  Computer-use validation passed in
  [manual run 34156045124](https://github.com/vjk7989/h0x-ade/actions/runs/34156045124)
  and [PR run 34156029125](https://github.com/vjk7989/h0x-ade/actions/runs/34156029125).
- Artifact-name/marker assertions and the Windows `h0x-ADE.exe` native smoke
  assertion were repaired and proven to advance past those steps.
- The full PR verify remains red only for deterministic core/fork debt outside
  this surface milestone: missing historic tags `v1.4.178-rc.2`, `v1.4.184`,
  and `v1.4.190`; stale core Orca/h0x tests and packaged-CLI alias assumptions;
  and the AppImage shutdown oracle.
- D: remains constrained after an `ENOSPC` failure, so remaining heavyweight
  checks stay CI-first. Keep Electron validation background-only with
  `ORCA_BACKGROUND_LAUNCH=1`.
- [Unsigned build run 34156752360](https://github.com/vjk7989/h0x-ade/actions/runs/34156752360)
  passed Windows x64, Linux x64, macOS x64, and macOS arm64 from merge SHA
  `99771ecfdf4000bba13c9d00840a9cd8371e191d`;
  [publish run 34157333798](https://github.com/vjk7989/h0x-ade/actions/runs/34157333798)
  then succeeded.
- Public release [v1.4.198](https://github.com/vjk7989/h0x-ade/releases/tag/v1.4.198)
  targets that SHA with 15 verified assets: `checksums.txt`, `latest.yml`,
  `latest-linux.yml`, `latest-mac.yml`, Windows installer and blockmap, Linux
  AppImage/DEB/RPM, and macOS x64/arm64 DMGs plus ZIPs/blockmaps.

### Compatibility And Fork Policy

- This pass deliberately excludes public API, RPC, remote-wire, storage,
  protocol/deep-link, package-ID, updater-state, and migration changes.
- Preserve `Orca Relay`, `ORCA_*`, internal Orca-named symbols/files, persisted
  identifiers, and other compatibility aliases unless a later core pass adds
  explicit migration and mixed-version coverage.
- `vjk7989/h0x-ade` is an independent fork. The `stablyai/orca` remote is a
  read-only source reference only; do not automatically merge, rebase, or
  publish against it.

## Core Compatibility Cleanup — Slice 1

Branch `codex/core-rebrand-ci-debt`; review:
[PR #3](https://github.com/vjk7989/h0x-ade/pull/3). Slice commits are
`83e02fbc95`, `5367be13a5`, and `986db506a8`.

- Canonical output remains `h0x`/`h0x-dev`. RPC and CLI compatibility inputs
  now also accept legacy `orca`, `orca-dev`, and `orca-ide`; the restricted
  packaged-Windows resume allowlist accepts `h0x`, `orca`, and `orca-ide`.
- Mutation recovery preserves the exact recorded executable in original,
  inspection, and keyed-retry commands. It does not rewrite a legacy command to
  h0x, expose credentials, or change the remote-wire shape.
- Claude Agent Teams detection launches canonically through `h0x` while probing
  `h0x-dev`, `orca`, `orca-dev`, and `orca-ide` as backward-compatible aliases.
  Claude remains required, aliases are deduplicated, and Windows/WSL detection
  remains disabled for this native-pane mode.
- Focused compatibility tests pass for the runtime compatibility resolver,
  Windows ask handoff, orchestration schemas, mutation recovery, TUI config and
  detection, process recognition, SSH fallback, and legacy dispatcher paths.
- At SHA `986db506a8`, [PR run 34161066785](https://github.com/vjk7989/h0x-ade/actions/runs/34161066785)
  passed the `typecheck` and `static analysis` jobs, including changed-code
  quality, skill, and localization checks. All eight full Node 24 shards remain
  red on the next stale canonical-output/test-fixture slice; those failures are
  not evidence that this compatibility slice regressed. Packaging failures in
  the same run remain separately tracked CI debt.

## Core Compatibility Cleanup — Slice 2

Commit `dab5199a1f` aligns 12 runtime/SSH/renderer test files with the canonical
`h0x` commands already emitted by production. It changes assertions and command
filters only; legacy inputs covered by slice 1 remain accepted, and no SSH,
folder-workspace, RPC, or remote-wire behavior changes.

- The 12 changed canonical-output files passed their focused gate.
- At head `dab5199a1f`, [PR run 34161877979](https://github.com/vjk7989/h0x-ade/actions/runs/34161877979)
  passed `typecheck`, `static analysis`, and Node 24 shard 2/8. Static analysis
  includes lint, type-aware and changed-code quality, skill freshness, and all
  localization checks.
- The other seven Node 24 shards remain red with 47 failures assigned to the
  next slices: packaged CLI/installer fixtures and legacy cleanup semantics;
  visible branding/localization expectations; skill and fork-specific CI
  contracts; and development/app/relay identity expectations. The Linux
  AppImage shutdown and Windows packaged-CLI smoke failures remain separate
  packaging debt.

## Core Compatibility Cleanup — Slice 3a

Commit `615d5f37cb` repairs packaged CLI test fixtures and restores the intended
distinction between canonical h0x assets and legacy Orca cleanup/ownership
cases. The changed production and test-support files clear typecheck and static
analysis; this slice does not claim a new global legacy command.

- In [PR Checks run 34163026331](https://github.com/vjk7989/h0x-ade/actions/runs/34163026331),
  all six changed suites passed: macOS command paths 14/14, AppImage ownership
  9/9, packaged assets 14/14, command conflicts 5/5, installer behavior 10/10,
  and installation races 8/8.
- Nine remaining unit failures belong to the next UI, skill, development
  identity, and account-branding slice. Windows packaged-CLI smoke remains
  separate later packaging debt.

## Fork Brand Contracts — Completed Slice

Commits `260e0f0fe3` and `880e9debf5` align fork-owned visible, generated, and
CI contracts without renaming retained compatibility identifiers.

- The Orca CLI skill description is 1012 characters and its source changes were
  regenerated into `src/cli/bundled-skill-guides.ts`,
  `resources/skills/current-manifest.json`, and
  `resources/skills/snapshot-registry.json`.
- NativeChat's visible paused-orchestration copy is covered by the six-locale
  `h0x-ADE` surface-brand contract. Account/onboarding expectations point to the
  fork while `Orca Relay` and internal compatibility names remain unchanged.
- Development identity assertions use `h0x-ADE`; release workflow contracts use
  this fork's GitHub-hosted macOS runner and `vjk7989/h0x-ade` repository and
  channel destinations.
- [PR Checks run 34164875243, attempt 2](https://github.com/vjk7989/h0x-ade/actions/runs/34164875243/attempts/2)
  passed typecheck, static analysis, and all eight Node 24 shards. Attempt 1's
  skill-install-lock failure was transient: the same check passed on the
  immediate rerun and the preceding run with no source change.
- Packaging is the next slice: Windows must select the packaged `h0x.exe`, and
  Linux must use canonical h0x usage text while satisfying the AppImage signal
  shutdown oracle.

## Packaging Smoke Contracts — Completed Slice

Commit `5110f33bfd` completes the canonical packaged-launch and Linux shutdown
contracts without adding a packaged or global legacy `orca` executable.

- Packaged CLI smoke selects `resources/bin/h0x.exe` on Windows and
  `resources/bin/h0x` on Linux; macOS packaging targets `h0x-ADE.app` and its
  canonical h0x launcher.
- Linux CLI launch and AppImage readiness oracles now expect canonical h0x usage
  text. The AppImage INT and TERM cases each reached actual signal delivery,
  reported `signalDelivery` with a PID and `registeredCliVerified: true`, and
  completed with no listener, surviving process, or filesystem residue.
- [PR Checks run 34166367530](https://github.com/vjk7989/h0x-ade/actions/runs/34166367530)
  passed all eight Node 24 shards, typecheck, static analysis, Windows packaged
  CLI smoke, Linux packaged CLI smoke, the Linux CLI launch contract, and both
  AppImage registered-CLI signal cases.
- [Computer-use E2E run 34166367389](https://github.com/vjk7989/h0x-ade/actions/runs/34166367389)
  passed for the same slice.
- To recover constrained D: space, the reproducible ignored cache
  `D:\the-ade\orca\.git\orca-cache\electron` was removed after inventorying;
  its exact size was 374,251,224 bytes. The ignored
  `external-checkouts/fluffy-lamp` checkout was preserved because it contains
  uncommitted user work. The same low-space boundary kept the release audit
  remote-only; no release artifacts were downloaded locally.

## Historical CI Compatibility — Completed Slice

Commits `2b104b2218` and `a83c179f18` make the fork's historical compatibility
fixtures deterministic without importing upstream history into persistent fork
state.

- `config/pinned-upstream-history.json` pins the annotated-tag object and peeled
  commit IDs for `v1.4.178-rc.2`, `v1.4.184`, and `v1.4.190`.
  `config/scripts/prepare-pinned-upstream-history.mjs` fetches only those exact
  public upstream tag refs into temporary CI refs, verifies both IDs, and
  cleans the temporary refs after use. Missing or moved refs fail closed.
- The PR cross-version lane and skill-update round-trip workflow run that helper
  before consuming historical fixtures. Upstream `stablyai/orca` is an immutable,
  read-only fixture source for these jobs only: no upstream workflow dispatch,
  merge, rebase, persistent ref, or push is permitted, and every persistent
  GitHub operation remains scoped to `vjk7989/h0x-ade`.
- `.github/workflows/track-community-prs.yaml` now guards the upstream-only
  community-project job so it skips outside `stablyai/orca`; the fork no longer
  requires `BUFO_BOT_PRIVATE_KEY` for that workflow.
- [PR Checks run 34168137863](https://github.com/vjk7989/h0x-ade/actions/runs/34168137863)
  passed all eight Node 24 shards, typecheck, static analysis, specialized
  lanes, all 40 cross-version tests, and Linux/Windows packaging.
- [Skill update round trip run 34168137706](https://github.com/vjk7989/h0x-ade/actions/runs/34168137706)
  passed all 13 matrix cells. [Computer-use E2E run 34168137522](https://github.com/vjk7989/h0x-ade/actions/runs/34168137522)
  also passed.
- The prior [PR run 34167939315](https://github.com/vjk7989/h0x-ade/actions/runs/34167939315)
  exposed only a lint failure in the new pinned-history helper/tests; it was
  diagnosed and minimally corrected by `a83c179f18` before the full green run.

## v1.4.199 Merge And Release — Completed Slice

Commit `0c1d3f1225` sets the package version to `1.4.199` and regenerates the
corresponding deterministic `resources/skills/release-mapping.json` row. The
candidate completed review, merge, unsigned cross-platform build, and public
release publication.

- [PR Checks run 34169330956](https://github.com/vjk7989/h0x-ade/actions/runs/34169330956)
  passed the complete gate: all eight Node 24 shards, typecheck, static analysis,
  specialized lanes, cross-version compatibility, and Windows/Linux packaging.
- [Skill update round trip run 34169330826](https://github.com/vjk7989/h0x-ade/actions/runs/34169330826)
  passed all 13 matrix cells.
- [Computer-use E2E run 34169330811](https://github.com/vjk7989/h0x-ade/actions/runs/34169330811)
  passed, and [PR LoC run 34169330813](https://github.com/vjk7989/h0x-ade/actions/runs/34169330813)
  passed for the same candidate.
- [PR #3](https://github.com/vjk7989/h0x-ade/pull/3) merged at commit
  `7b1ff928a2b9c09a04f10763b2f399cb8248445b`.
- [Unsigned build run 34169861643](https://github.com/vjk7989/h0x-ade/actions/runs/34169861643)
  succeeded for Windows x64, Linux x64, macOS x64, and macOS arm64. Its exact
  artifact containers are
  `h0x-windows-x64-7b1ff928a2b9c09a04f10763b2f399cb8248445b`,
  `h0x-linux-x64-7b1ff928a2b9c09a04f10763b2f399cb8248445b`,
  `h0x-macos-x64-7b1ff928a2b9c09a04f10763b2f399cb8248445b`, and
  `h0x-macos-arm64-7b1ff928a2b9c09a04f10763b2f399cb8248445b`.
- [Publish run 34176854048](https://github.com/vjk7989/h0x-ade/actions/runs/34176854048)
  passed source-build verification, asset staging, release-note and checksum
  generation, uploaded-asset verification, and publication.
- Public release [v1.4.199](https://github.com/vjk7989/h0x-ade/releases/tag/v1.4.199)
  is neither a draft nor a prerelease. Its target and lightweight tag both
  resolve to merge commit `7b1ff928a2b9c09a04f10763b2f399cb8248445b`.
- The 15 required release assets are `checksums.txt`, `latest.yml`,
  `latest-linux.yml`, `latest-mac.yml`, `h0x-windows-setup.exe`,
  `h0x-windows-setup.exe.blockmap`, `h0x-linux.AppImage`,
  `h0x_1.4.199_amd64.deb`, `h0x-1.4.199.x86_64.rpm`,
  `h0x-macos-x64.dmg`, `h0x-macos-arm64.dmg`, `h0x-ADE-1.4.199-mac.zip`,
  `h0x-ADE-1.4.199-mac.zip.blockmap`,
  `h0x-ADE-1.4.199-arm64-mac.zip`, and
  `h0x-ADE-1.4.199-arm64-mac.zip.blockmap`. An independent remote artifact
  audit passed; the existing low-space boundary above explains why no local
  artifact copies were downloaded.

## Deterministic Surface Rebrand — Completed Local Slice

The current surface-rebrand work centralizes canonical identity in
`src/shared/brand.ts`: `h0x-ADE` is the product display name and `h0x` is the
CLI display name. Desktop, web, and dashboard document titles, Electron main
and dashboard window titles, shell-facing copy, tray tooltip/menu copy, and the
local, daemon, and relay `TERM_PROGRAM` value now use `h0x-ADE`. The tray loads
`resources/tray/h0x-menu-barTemplate.png` and its `@2x` counterpart.

- `resources/brand/h0x-mark-source.png` is the authoritative 1254 × 1254 logo
  source, pinned by SHA-256
  `D54E012E3A323D284E5CF0AB9A41522F89A92B3AA3DF4D10316E5A06B267B6F8`.
  `config/scripts/generate-h0x-brand-assets.mjs` deterministically emits the
  black/white renderer marks, app/build/dev icons, six-frame Windows ICO,
  pre-sized 16–512 px Linux icons, icon-source asset, 1×/2× tray templates,
  mobile icon/adaptive/splash/favicon assets, and documentation logo/favicon.
  `build:brand-assets` writes them and `check:brand-assets` verifies byte-for-byte
  freshness.
- `config/scripts/visible-brand-inventory.mjs` scans production UI, docs,
  localization catalogs, skills, plugins, mobile surfaces, native sources, and
  packaging configuration. Its allowlist covers 78 exact path-and-text
  compatibility matches; entries are rejected when stale, duplicated, or
  missing a reason. Legacy Orca names remain only at deliberate input,
  mixed-version, migration, cleanup, persisted-key/file, protocol/header,
  environment-variable, helper-bundle, process-recognition, and internal-symbol
  boundaries.
- `config/scripts/check-changed-code-quality.mjs` chunks Windows Oxlint file
  arguments under a deterministic 20,000-character command budget and merges
  diagnostics, allowing the complete 860-file changed-code set to run without
  exceeding Windows command-line limits.
- Earlier focused execution passed 188 tests. Independent execution then passed
  216 tests with 2 skipped; the logo contract passed 47 tests; scanner and
  changed-quality coverage passed 22 tests; and the locale/manifest batch passed
  65 tests with 3 skipped. Localization and skill freshness verifiers,
  `pnpm tc`, and changed-code quality across all 860 files also passed.

Rendered Electron validation and package CI for this new surface slice, its
merge, any further version bump, and release publication are not established by
these local gates and remain pending.

## Mobile Compatibility And Rebrand — Completed Slice

Commit `9bd6aa1a8b` completes the scoped mobile identity and compatibility
contracts while leaving existing installations and mixed-version pairing
inputs usable.

- The Expo launcher display name is `h0x-ADE Mobile`, and Android release output
  uses the same display identity. The release contract also pins the existing
  `pavii-h0x` scheme, mobile package IDs, and generated brand-asset paths.
- New pairing URLs are emitted with the canonical `pavii-h0x` scheme. Desktop
  and mobile parsers additively accept legacy `orca://pair` input, including
  case-normalized valid forms, while rejecting lookalike schemes and routes;
  this is an input compatibility boundary, not a legacy-output restoration.
- Stale mobile component, diagnostics, session, source-control, task, release,
  and transport assertions now reflect current `h0x`/`h0x-ADE` behavior. The
  generated mobile icon dimension contract includes `mobile/assets/icon.png`,
  and the bundled navigation plugin content hash was refreshed to match its
  generated content.
- Adjacent shell/static-analysis findings were resolved with narrowly scoped
  production cleanup, including neutral GitHub stacked-PR ambiguity messages;
  no RPC, storage, remote-wire, or package-ID migration was introduced.
- Focused local tests, typecheck, generated-asset/manifest verification, and
  changed-code quality passed. The GitHub mobile verification workflow also
  passed for this commit.

This records only the completed mobile slice. The complete PR gate, merge,
unsigned platform builds, and release verification remain pending and are not
implied by the focused green evidence above.

## Historical VM Rollback Fixture Pin — Completed Local Slice

The static-analysis rollback reproduction now obtains its two immutable VM
runtime source fixtures without requiring the fork checkout to contain
unrelated upstream history.

- `config/pinned-upstream-history.json` adds the exact upstream commits
  `bf0c77d5bc800e19117084c27fd1441eda9134ad` (`vm_runtime_baseline`) and
  `25abb9368d98ad84a174f530e02f4228d2269062` (`vm_runtime_affected`). The
  existing annotated-tag object and peeled-commit pins remain unchanged.
- `config/scripts/prepare-pinned-upstream-history.mjs` validates tag and commit
  entries under one unique ID namespace. Requested commits are fetched by
  exact SHA, with `--no-tags`, `--no-write-fetch-head`, and `--depth=1`, from
  the read-only `https://github.com/stablyai/orca.git` fixture source into
  `refs/h0x-ci/upstream-commits/<id>`. The helper verifies that each temporary
  ref is a commit and peels to the pinned SHA; an already verified ref is
  reused without another fetch. Tag fixtures continue to use
  `refs/h0x-ci/upstream-tags/<tag>` and retain their remote annotated-tag
  verification.
- `.github/workflows/pr.yml` prepares exactly
  `vm_runtime_baseline,vm_runtime_affected` immediately before
  `run-ephemeral-vm-runtime-store-rollback-repro.mjs`. The workflow contains no
  upstream push and creates no persistent fork ref.
- `config/scripts/pinned-upstream-history.test.mjs` covers manifest commit pins,
  exact fetch arguments, temporary-ref reuse, mismatched fetched commits,
  malformed commit IDs, duplicate IDs, and the existing tag behavior.
  `config/scripts/pinned-upstream-history-workflows.test.mjs` verifies ordering,
  the exact selected IDs, and the no-push contract for the rollback step.

This slice fixes the deterministic fixture setup locally only. The PR CI rerun,
unsigned Android and iOS simulator builds and artifact inspection, the complete
desktop gate, merge, version bump, unsigned desktop builds, and `v1.4.200`
publication all remain pending.

## Full-Suite Brand Oracle Corrections — Completed Local Slice

The full-suite follow-up aligns stale test oracles with the canonical
`h0x`/`h0x-ADE` output already produced by the application. Changes are scoped
to assertions, fixtures, and selectors across `config`, `src/cli`, `src/main`,
`src/renderer`, and `src/shared`; they do not introduce a new compatibility
alias or change runtime, RPC, storage, package-ID, or remote-wire behavior.

- PR workflow contracts now require explicit visible-brand inventory and logo
  freshness steps. Wrapper fixtures and snapshots were regenerated from their
  canonical sources rather than edited as independent outputs.
- Hidden Electron E2E selectors now target the current h0x-ADE title and brand
  surfaces, preserving the required background-only launch and CDP validation
  path without focusing or revealing a window.
- Focused tests covering the corrected config, CLI, main, renderer, and shared
  oracles passed. The visible-brand scanner, logo freshness contract, and
  changed-code quality gate also passed.
- Local Windows runs of the complete Node shard set were non-representative
  because platform-specific and CI environment assumptions differ from the
  Linux PR runner. They are retained as diagnostic evidence only, not as the
  authoritative full-suite verdict.

The Linux PR CI rerun is pending. This local slice therefore does not yet claim
the complete PR gate, merge, unsigned platform builds, version bump, or
`v1.4.200` publication.
