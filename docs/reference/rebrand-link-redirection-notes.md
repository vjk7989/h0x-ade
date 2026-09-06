# h0x-ADE Link Redirection Notes

This is the rebrand redirect checklist. Default GitHub/release destinations have
been applied where they are active public product links; website, docs, store,
community, privacy, telemetry, and operational endpoints still need final
h0x/PAVii destinations.

## Applied Default GitHub And Release Mappings

- `https://github.com/stablyai/orca` -> `https://github.com/vjk7989/h0x-ade`
- `https://github.com/stablyai/orca/releases` -> `https://github.com/vjk7989/h0x-ade/releases`
- `https://github.com/stablyai/orca/releases/latest` -> `https://github.com/vjk7989/h0x-ade/releases/latest`
- `https://github.com/stablyai/orca/releases/latest/download/orca-macos-arm64.dmg` -> `https://github.com/vjk7989/h0x-ade/releases/latest/download/h0x-macos-arm64.dmg`
- `https://github.com/stablyai/orca/releases/latest/download/orca-macos-x64.dmg` -> `https://github.com/vjk7989/h0x-ade/releases/latest/download/h0x-macos-x64.dmg`
- `https://github.com/stablyai/orca/releases/latest/download/orca-windows-setup.exe` -> `https://github.com/vjk7989/h0x-ade/releases/latest/download/h0x-windows-setup.exe`
- `https://github.com/stablyai/orca/releases/latest/download/orca-linux.AppImage` -> `https://github.com/vjk7989/h0x-ade/releases/latest/download/h0x-linux.AppImage`
- `https://github.com/stablyai/orca/releases/download/mobile-android-v0.0.47/app-release.apk` -> `https://github.com/vjk7989/h0x-ade/releases/download/mobile-android-v0.0.47/app-release.apk`

Historical issue/PR links, generic Git URL parser fixtures, and reliability
evidence may still mention `stablyai/orca`; keep those unless the surrounding
surface becomes user-facing product copy.

## Website And Product Links Awaiting Mapping

- `https://onorca.dev/`
- `https://onorca.dev/download`
- `https://onorca.dev/changelog`
- `https://www.onorca.dev`

## Docs Links

- `https://www.onorca.dev/docs`
- `https://www.onorca.dev/docs/mobile`
- `https://www.onorca.dev/docs/model/worktrees`
- `https://www.onorca.dev/docs/terminal`
- `https://www.onorca.dev/docs/browser/design-mode`
- `https://www.onorca.dev/docs/review/linear`
- `https://www.onorca.dev/docs/ssh`
- `https://www.onorca.dev/docs/review/annotate-ai-diff`
- `https://www.onorca.dev/docs/editing/file-explorer`
- `https://www.onorca.dev/docs/cli/overview`
- `https://www.onorca.dev/docs/model/quick-open`
- `https://www.onorca.dev/docs/agents/usage-tracking`
- `https://www.onorca.dev/docs/editing/markdown`
- `https://www.onorca.dev/docs/cli/computer-use`
- `https://www.onorca.dev/docs/notifications`
- `https://www.onorca.dev/docs/android-apk`
- `https://www.onorca.dev/docs/telemetry`

## Community And Store Links

- `https://discord.gg/fzjDKHxv8Q`
- `https://x.com/orca_build`
- `https://apps.apple.com/us/app/orca-ide/id6766130217`
- `https://testflight.apple.com/join/YjeGMQBA`

## Package Manager Links

- Homebrew casks currently point at `github.com/stablyai/orca` and `https://onorca.dev/`.
- README currently documents `brew install --cask stablyai/orca/orca`.

## Internal Or Historical Links To Treat Carefully

- Relay/cloud references such as `relay.onorca.dev`, `login.onorca.dev`, and
  `stablyai/orca-cloud` are operational or historical and should not be bulk
  rewritten without a relay migration plan.
- Reliability notes and tests reference historical GitHub issues/PRs under
  `stablyai/orca`; keep those as history unless the surrounding page is
  product-facing.
- Bundled launch plugins under `resources/plugins/launch/stablyai.*` reference
  separate plugin repositories; migrate only when replacement plugin repos exist.
