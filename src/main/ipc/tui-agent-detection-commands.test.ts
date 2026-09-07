import { describe, expect, it } from 'vitest'
import {
  getTuiAgentDetectionProbeCommands,
  KNOWN_TUI_AGENT_DETECTION_COMMANDS,
  resolveDetectedTuiAgentIds
} from './tui-agent-detection-commands'

describe('tui agent detection commands', () => {
  it('requires Claude before reporting Claude Agent Teams', () => {
    const commands = KNOWN_TUI_AGENT_DETECTION_COMMANDS.filter(
      (command) => command.id === 'claude-agent-teams'
    )

    expect(commands).toEqual([
      {
        id: 'claude-agent-teams',
        cmd: 'h0x',
        requiredCommands: ['claude'],
        unsupportedRuntimes: ['win32', 'wsl']
      },
      {
        id: 'claude-agent-teams',
        cmd: 'h0x-dev',
        requiredCommands: ['claude'],
        unsupportedRuntimes: ['win32', 'wsl']
      },
      {
        id: 'claude-agent-teams',
        cmd: 'orca',
        requiredCommands: ['claude'],
        unsupportedRuntimes: ['win32', 'wsl']
      },
      {
        id: 'claude-agent-teams',
        cmd: 'orca-dev',
        requiredCommands: ['claude'],
        unsupportedRuntimes: ['win32', 'wsl']
      },
      {
        id: 'claude-agent-teams',
        cmd: 'orca-ide',
        requiredCommands: ['claude'],
        unsupportedRuntimes: ['win32', 'wsl']
      }
    ])
    expect(getTuiAgentDetectionProbeCommands(commands, 'linux')).toEqual([
      'h0x',
      'claude',
      'h0x-dev',
      'orca',
      'orca-dev',
      'orca-ide'
    ])
    for (const command of ['h0x', 'h0x-dev', 'orca', 'orca-dev', 'orca-ide']) {
      expect(resolveDetectedTuiAgentIds(commands, new Set([command]), 'linux')).toEqual([])
      expect(resolveDetectedTuiAgentIds(commands, new Set([command, 'claude']), 'linux')).toEqual([
        'claude-agent-teams'
      ])
    }
    expect(getTuiAgentDetectionProbeCommands(commands, 'win32')).toEqual([])
    expect(
      resolveDetectedTuiAgentIds(commands, new Set(['h0x', 'orca', 'claude']), 'win32')
    ).toEqual([])
    expect(getTuiAgentDetectionProbeCommands(commands, 'wsl')).toEqual([])
    expect(resolveDetectedTuiAgentIds(commands, new Set(['orca-ide', 'claude']), 'wsl')).toEqual([])
  })
})
