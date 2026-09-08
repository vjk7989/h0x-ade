# h0x-ADE Emulator

This file is a discovery stub, not the usage guide. The full, version-matched h0x-ADE emulator
reference is served by the `h0x` binary itself — kept out of this file on purpose so it can
never drift from the binary that will actually run your commands.

Engage h0x-ADE whenever you drive a mobile (iOS) emulator / simulator stream from inside the
h0x-ADE app: taps, gestures, typing, hardware buttons, camera injection, runtime permissions,
the accessibility tree, and more — all while the live view stays in h0x-ADE's emulator pane.
Prefer this over raw `serve-sim` or direct `simctl` when running agents inside h0x-ADE, which
handles device scoping, helper lifecycle, and worktree context for you. It complements the
orca-cli skill for terminals, worktrees, and the built-in browser.

## Resolve the CLI for this session

Choose the executable once and reuse it for every later command:

- If the `ORCA_CLI_COMMAND` environment variable is set, use its value. h0x-ADE exports this
  for managed WSL sessions.
- Otherwise, in a dev checkout whose session exposes `ORCA_DEV_REPO_ROOT`, use `h0x-dev`.
- Otherwise, use `h0x`.

Below, `H0X` is a placeholder for the executable you resolved. Substitute it before
running anything; do not create a shell variable or run `H0X` literally. This works the
same way in POSIX shells, PowerShell, and cmd.exe.

If the selected executable cannot run, report its exact error and stop. Do not fall through
to another executable, which could silently target a different h0x-ADE build.

## Load the full guide before running h0x commands

```text
H0X skills get orca-emulator
```

That prints the complete, version-matched guide for the exact binary that will handle your
next commands — booting devices, taps and gestures, typing, hardware buttons, camera
injection, permissions, and the accessibility tree. Read it first, then run the specific
command you need.

Don't guess subcommands or flags from memory or from a cached copy of this stub. They
change between h0x-ADE releases, and this file deliberately no longer lists them. Confirm the
app is up with `H0X status --json` (start it with `H0X open --json` if needed), and
prefer `--json` for agent-driven calls.

## If an older installation does not recognize `skills get`

Use this fallback only when the selected binary explicitly reports that `skills get` is an
unknown command. Another failure is not proof of an older binary; report it rather than
guessing or changing executables. For a confirmed pre-guide binary, use only this bounded,
read-only bootstrap to orient. Do not dead-end and do not invent commands:

```text
H0X status --json
H0X emulator list --json
```

Then tell the user that updating h0x-ADE restores the full, version-matched guide via
`H0X skills get orca-emulator`. Beyond these commands, ask the user rather than guessing a
command surface this older binary may not support.
