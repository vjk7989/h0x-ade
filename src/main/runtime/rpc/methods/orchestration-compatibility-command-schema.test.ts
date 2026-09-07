import { describe, expect, it } from 'vitest'
import { AskParams, CheckParams } from './orchestration-schemas'

const COMPATIBILITY_COMMANDS = ['h0x', 'h0x-dev', 'orca', 'orca-dev', 'orca-ide'] as const

describe('orchestration compatibility command schemas', () => {
  it.each(COMPATIBILITY_COMMANDS)('accepts %s for check and ask compatibility', (command) => {
    expect(CheckParams.safeParse({ compatibilityCliCommand: command }).success).toBe(true)
    expect(
      AskParams.safeParse({ question: 'Proceed?', compatibilityCliCommand: command }).success
    ).toBe(true)
  })

  it.each(['h0x', 'orca', 'orca-ide'] as const)(
    'accepts %s as a packaged Windows resume command',
    (command) => {
      expect(
        AskParams.safeParse({ question: 'Proceed?', compatibilityWindowsCommand: command }).success
      ).toBe(true)
    }
  )

  it.each(['', 'H0X', '/usr/local/bin/h0x', 'other'])(
    'rejects untrusted compatibility command %j',
    (command) => {
      expect(CheckParams.safeParse({ compatibilityCliCommand: command }).success).toBe(false)
      expect(
        AskParams.safeParse({ question: 'Proceed?', compatibilityCliCommand: command }).success
      ).toBe(false)
    }
  )
})
