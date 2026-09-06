import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const BROWSER_BASIC_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['open-url'],
    summary: 'Open a URL on the paired client that hosts this terminal',
    usage: 'h0x open-url --url <url> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'url', 'worktree']
  },
  {
    path: ['snapshot'],
    summary: 'Capture an accessibility snapshot of the active browser tab',
    usage: 'h0x snapshot [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree']
  },
  {
    path: ['screenshot'],
    summary: 'Capture a viewport screenshot of the active browser tab',
    usage: 'h0x screenshot [--format <png|jpeg>] [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'format', 'worktree']
  },
  {
    path: ['click'],
    summary: 'Click a browser element by ref',
    usage: 'h0x click --element <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'worktree']
  },
  {
    path: ['fill'],
    summary: 'Clear and fill a browser input by ref',
    usage: 'h0x fill --element <ref> --value <text> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'value', 'worktree']
  },
  {
    path: ['type'],
    summary: 'Type text at the current browser focus',
    usage: 'h0x type --input <text> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'input', 'worktree']
  },
  {
    path: ['select'],
    summary: 'Select a dropdown option by ref',
    usage: 'h0x select --element <ref> --value <value> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'value', 'worktree']
  },
  {
    path: ['scroll'],
    summary: 'Scroll the browser viewport',
    usage: 'h0x scroll --direction <up|down> [--amount <pixels>] [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'direction', 'amount', 'worktree']
  },
  {
    path: ['goto'],
    summary: 'Navigate the active browser tab to a URL',
    usage: 'h0x goto --url <url> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'url', 'worktree']
  },
  {
    path: ['back'],
    summary: 'Navigate back in browser history',
    usage: 'h0x back [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree']
  },
  {
    path: ['reload'],
    summary: 'Reload the active browser tab',
    usage: 'h0x reload [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree']
  },
  {
    path: ['eval'],
    summary: 'Evaluate JavaScript in the browser page context',
    usage: 'h0x eval --expression <js> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'expression', 'worktree']
  },
  {
    path: ['wait'],
    summary: 'Wait for element, text, URL, load state, JS condition, or timeout',
    usage:
      'h0x wait [--selector <sel>] [--timeout <ms>] [--text <text>] [--url <pattern>] [--load <state>] [--fn <js>] [--state <hidden|visible>] [--worktree <selector>] [--json]',
    allowedFlags: [
      ...GLOBAL_FLAGS,
      'selector',
      'timeout',
      'text',
      'url',
      'load',
      'fn',
      'state',
      'worktree'
    ]
  },
  {
    path: ['check'],
    summary: 'Check a checkbox/radio by ref',
    usage: 'h0x check --element <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'worktree']
  },
  {
    path: ['uncheck'],
    summary: 'Uncheck a checkbox/radio by ref',
    usage: 'h0x uncheck --element <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'worktree']
  },
  {
    path: ['focus'],
    summary: 'Focus a browser element by ref',
    usage: 'h0x focus --element <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'worktree']
  },
  {
    path: ['clear'],
    summary: 'Clear an input element by ref',
    usage: 'h0x clear --element <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'worktree']
  },
  {
    path: ['select-all'],
    summary: 'Select all text in an input by ref',
    usage: 'h0x select-all --element <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'worktree']
  },
  {
    path: ['keypress'],
    summary: 'Press a key (Enter, Tab, Escape, ArrowDown, etc.)',
    usage: 'h0x keypress --key <name> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'key', 'worktree']
  },
  {
    path: ['pdf'],
    summary: 'Export the active browser tab as PDF',
    usage: 'h0x pdf [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree']
  },
  {
    path: ['full-screenshot'],
    summary: 'Capture a full-page screenshot (beyond viewport)',
    usage: 'h0x full-screenshot [--format <png|jpeg>] [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'format', 'worktree']
  },
  {
    path: ['hover'],
    summary: 'Hover over a browser element by ref',
    usage: 'h0x hover --element <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'worktree']
  },
  {
    path: ['drag'],
    summary: 'Drag from one element to another',
    usage: 'h0x drag --from <ref> --to <ref> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'from', 'to', 'worktree']
  },
  {
    path: ['upload'],
    summary: 'Upload files to a file input element',
    usage: 'h0x upload --element <ref> --files <path,...> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'element', 'files', 'worktree']
  },
  {
    path: ['tab', 'list'],
    summary: 'List open browser tabs',
    usage: 'h0x tab list [--worktree <selector|all>] [--show-profile] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree', 'show-profile']
  },
  {
    path: ['tab', 'show'],
    summary: 'Show one browser tab by page id',
    usage: 'h0x tab show --page <id> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'page', 'worktree']
  },
  {
    path: ['tab', 'current'],
    summary: 'Show the current browser tab',
    usage: 'h0x tab current [--worktree <selector|all>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree']
  },
  {
    path: ['tab', 'switch'],
    summary: 'Switch the active browser tab',
    usage: 'h0x tab switch (--index <n> | --page <id>) [--worktree <selector>] [--focus] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'index', 'page', 'worktree', 'focus']
  },
  {
    path: ['tab', 'create'],
    summary: 'Create a new browser tab in the current worktree',
    usage: 'h0x tab create [--url <url>] [--worktree <selector>] [--profile <id>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'url', 'worktree', 'profile']
  },
  {
    path: ['tab', 'profile', 'list'],
    summary: 'List browser session profiles available to browser tabs',
    usage: 'h0x tab profile list [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['tab', 'profile', 'create'],
    summary: 'Create a browser session profile for browser tabs',
    usage:
      'h0x tab profile create --label <name> [--scope <isolated|imported>] [--no-ua-spoof] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'label', 'scope', 'no-ua-spoof']
  },
  {
    path: ['tab', 'profile', 'delete'],
    destructive: true,
    summary: 'Delete a browser session profile used by browser tabs',
    usage: 'h0x tab profile delete --profile <id> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'profile']
  },
  {
    path: ['tab', 'profile', 'set'],
    summary: 'Switch a browser tab to a different browser profile',
    usage: 'h0x tab profile set (--page <id> | --worktree <selector>) --profile <id> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'profile', 'page', 'worktree']
  },
  {
    path: ['tab', 'profile', 'show'],
    summary: 'Show the browser profile bound to a tab',
    usage: 'h0x tab profile show --page <id> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'page', 'worktree']
  },
  {
    path: ['tab', 'profile', 'use-default'],
    summary: 'Switch a browser tab back to the default browser profile',
    usage: 'h0x tab profile use-default --page <id> [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'page', 'worktree']
  },
  {
    path: ['tab', 'profile', 'clone'],
    summary: 'Clone a browser tab into a different browser profile',
    usage: 'h0x tab profile clone --profile <id> [--page <id>] [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'profile', 'page', 'worktree']
  },
  {
    path: ['tab', 'close'],
    summary: 'Close a browser tab',
    usage: 'h0x tab close [--index <n>] [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'index', 'worktree']
  },
  {
    path: ['exec'],
    summary: 'Run any agent-browser command against the active browser tab',
    usage: 'h0x exec --command "<agent-browser command>" [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'command', 'worktree']
  }
]
