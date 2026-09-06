import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

const CLOUD_FLAGS = ['api-url']

export const ARTIFACT_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['artifacts', 'share'],
    summary: 'Share an HTML or Markdown file with your Orca account',
    usage: 'h0x artifacts share <file> [--api-url <url>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, ...CLOUD_FLAGS, 'file'],
    positionalArgs: ['file'],
    examples: ['h0x artifacts share ./report.html', 'h0x artifacts share ./notes.md --json']
  },
  {
    path: ['artifacts', 'update'],
    summary: 'Update a file previously shared from this Orca profile',
    usage: 'h0x artifacts update <file> [--api-url <url>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, ...CLOUD_FLAGS, 'file'],
    positionalArgs: ['file']
  },
  {
    path: ['artifacts', 'unshare'],
    destructive: true,
    summary: 'Delete the artifact associated with a previously shared file',
    usage: 'h0x artifacts unshare <file> [--api-url <url>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, ...CLOUD_FLAGS, 'file'],
    positionalArgs: ['file']
  },
  {
    path: ['artifacts', 'list'],
    summary: 'List artifacts owned by the signed-in Orca account',
    usage: 'h0x artifacts list [--cursor <cursor>] [--api-url <url>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, ...CLOUD_FLAGS, 'cursor']
  },
  {
    path: ['artifacts', 'delete'],
    aliases: [['artifacts', 'rm']],
    destructive: true,
    summary: 'Delete an artifact owned by the signed-in Orca account',
    usage: 'h0x artifacts delete <id> [--api-url <url>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, ...CLOUD_FLAGS, 'id'],
    positionalArgs: ['id']
  }
]
