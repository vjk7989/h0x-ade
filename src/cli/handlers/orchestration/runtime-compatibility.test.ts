import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isDevCliInvocation,
  resolveCompatibilityCliCommand,
  resolvePackagedWindowsCompatibilityCommand
} from './runtime-compatibility'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('orchestration runtime compatibility', () => {
  it.each(['h0x', 'h0x-dev', 'orca', 'orca-dev', 'orca-ide'] as const)(
    'preserves the explicit %s command identity',
    (command) => {
      vi.stubEnv('ORCA_CLI_COMMAND', command)
      expect(resolveCompatibilityCliCommand()).toBe(command)
    }
  )

  it('defaults unknown or missing command identities to h0x', () => {
    vi.stubEnv('ORCA_CLI_COMMAND', 'other')
    expect(resolveCompatibilityCliCommand()).toBe('h0x')
    vi.stubEnv('ORCA_CLI_COMMAND', '')
    expect(resolveCompatibilityCliCommand()).toBe('h0x')
  })

  it.each(['h0x', 'orca', 'orca-ide'] as const)(
    'preserves the packaged Windows %s launcher',
    (command) => {
      vi.stubEnv('ORCA_WINDOWS_PACKAGED_CLI_LAUNCHER', '1')
      vi.stubEnv('ORCA_CLI_COMMAND', command)
      expect(resolvePackagedWindowsCompatibilityCommand()).toBe(command)
    }
  )

  it.each(['h0x-dev', 'orca-dev', 'other', ''])(
    'rejects the packaged Windows %s launcher',
    (command) => {
      vi.stubEnv('ORCA_WINDOWS_PACKAGED_CLI_LAUNCHER', '1')
      vi.stubEnv('ORCA_CLI_COMMAND', command)
      expect(() => resolvePackagedWindowsCompatibilityCommand()).toThrow(
        'did not provide a valid resume command'
      )
    }
  )

  it.each(['C:/Users/test/AppData/Roaming/h0x-dev', '/home/test/.config/orca-dev'])(
    'recognizes current and legacy development profiles at %s',
    (userDataPath) => {
      vi.stubEnv('ORCA_USER_DATA_PATH', userDataPath)
      expect(isDevCliInvocation()).toBe(true)
    }
  )
})
