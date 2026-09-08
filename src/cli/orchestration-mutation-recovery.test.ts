import { describe, expect, it } from 'vitest'
import { runProcess } from '../shared/child-process/run-process'
import {
  orchestrationMutationRecoveryError,
  renderCommand
} from './orchestration-mutation-recovery'
import { RuntimeClientError } from './runtime-client'

describe('orchestration mutation recovery', () => {
  it('queries a known dispatch before issuing the keyed retry', () => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_1',
        dispatchId: 'dispatch_1',
        originalCommand: ['h0x', 'orchestration', 'worker-start', '--task', 'task_1']
      })
    ) as RuntimeClientError

    expect(result.data).toMatchObject({
      recovery: {
        orchestrationRequestId: 'request_1',
        dispatchId: 'dispatch_1',
        queryCommand: ['h0x', 'orchestration', 'worker-show', '--dispatch', 'dispatch_1', '--json'],
        retryCommand: [
          'h0x',
          'orchestration',
          'worker-start',
          '--task',
          'task_1',
          '--retry-request',
          'request_1'
        ],
        workerDeathInferred: false
      }
    })
    const queryStep = `Run ${renderCommand([
      'h0x',
      'orchestration',
      'worker-show',
      '--dispatch',
      'dispatch_1',
      '--json'
    ])} before retrying.`
    const retryStep = `After inspecting the Dispatch, if keyed recovery is still needed, run ${renderCommand(
      ['h0x', 'orchestration', 'worker-start', '--task', 'task_1', '--retry-request', 'request_1']
    )}. --retry-request reuses the same operation identity so h0x-ADE can replay, join, or safely recover it without starting a separate duplicate.`
    expect(result.message.indexOf(queryStep)).toBeLessThan(result.message.indexOf(retryStep))
    expect((result.data as { nextSteps?: string[] }).nextSteps).toEqual([queryStep, retryStep])
  })

  it('does not invent a dispatch for an old-client-shaped error', () => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_2',
        originalCommand: ['h0x', 'orchestration', 'worker-start', '--task', 'task_2']
      })
    ) as RuntimeClientError

    expect(result.data).toMatchObject({
      recovery: {
        orchestrationRequestId: 'request_2',
        retryCommand: expect.arrayContaining(['--retry-request', 'request_2']),
        workerDeathInferred: false
      }
    })
    expect((result.data as Record<string, unknown>).recovery).not.toHaveProperty('dispatchId')
    expect(result.message).not.toContain('worker death')
  })

  it('offers a read-only request lookup when the response carried no dispatch', () => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_unavailable', 'runtime unavailable', {
        orchestrationRequestId: 'request_4',
        originalCommand: ['h0x', 'orchestration', 'worker-start', '--task', 'task_4']
      })
    ) as RuntimeClientError

    expect(result.data).toMatchObject({
      recovery: {
        queryCommand: ['h0x', 'orchestration', 'request-show', '--request', 'request_4', '--json']
      }
    })
    expect((result.data as { nextSteps?: string[] }).nextSteps?.[0]).toBe(
      `Run ${renderCommand(['h0x', 'orchestration', 'request-show', '--request', 'request_4', '--json'])} before retrying.`
    )
  })

  it('describes keyed retry without overclaiming one replay outcome', () => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_5',
        originalCommand: ['h0x', 'orchestration', 'worker-start', '--task', 'task_5']
      })
    ) as RuntimeClientError

    expect((result.data as { nextSteps?: string[] }).nextSteps?.[1]).toContain(
      'replay, join, or safely recover it without starting a separate duplicate'
    )
    expect((result.data as { nextSteps?: string[] }).nextSteps?.[1]).toContain(
      'absence does not prove a retry is safe'
    )
  })

  it('renders the exact executable and safely quotes original arguments', () => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_3',
        dispatchId: 'dispatch_3',
        originalCommand: [
          'h0x-dev',
          'orchestration',
          'worker-start',
          '--task',
          'task 3',
          '--comment',
          'literal $(do-not-run)'
        ]
      })
    ) as RuntimeClientError

    expect((result.data as { nextSteps?: string[] }).nextSteps).toEqual([
      `Run ${renderCommand(['h0x-dev', 'orchestration', 'worker-show', '--dispatch', 'dispatch_3', '--json'])} before retrying.`,
      `After inspecting the Dispatch, if keyed recovery is still needed, run ${renderCommand(['h0x-dev', 'orchestration', 'worker-start', '--task', 'task 3', '--comment', 'literal $(do-not-run)', '--retry-request', 'request_3'])}. --retry-request reuses the same operation identity so h0x-ADE can replay, join, or safely recover it without starting a separate duplicate.`
    ])
    expect(result.message).toContain('literal $(do-not-run)')
  })

  it('parses legacy command text without changing its executable or quoted arguments', () => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_4',
        originalCommand:
          'orca-ide orchestration worker-stop --dispatch dispatch_4 --comment "quoted value"'
      })
    ) as RuntimeClientError

    expect(
      (result.data as { recovery?: { retryCommand?: string[] } }).recovery?.retryCommand
    ).toEqual([
      'orca-ide',
      'orchestration',
      'worker-stop',
      '--dispatch',
      'dispatch_4',
      '--comment',
      'quoted value',
      '--retry-request',
      'request_4'
    ])
  })

  it.each(['h0x', 'h0x-dev', 'orca', 'orca-dev', 'orca-ide'])(
    'preserves the explicit %s executable in recovery commands',
    (executable) => {
      const result = orchestrationMutationRecoveryError(
        new RuntimeClientError('runtime_timeout', 'request timed out', {
          orchestrationRequestId: 'request_cli_identity',
          originalCommand: [executable, 'orchestration', 'worker-start', '--task', 'task_1']
        })
      ) as RuntimeClientError

      expect(
        (result.data as { recovery?: { queryCommand?: string[]; retryCommand?: string[] } })
          .recovery
      ).toMatchObject({
        queryCommand: [
          executable,
          'orchestration',
          'request-show',
          '--request',
          'request_cli_identity',
          '--json'
        ],
        retryCommand: [
          executable,
          'orchestration',
          'worker-start',
          '--task',
          'task_1',
          '--retry-request',
          'request_cli_identity'
        ]
      })
    }
  )

  it.each([
    [
      'gate-create',
      ['h0x', 'orchestration', 'gate-create', '--task', 'task_1', '--question', 'ship?']
    ],
    [
      'worker-retain',
      ['h0x', 'orchestration', 'worker-retain', '--dispatch', 'dispatch_1', '--json']
    ]
  ])('replays exact %s argv with the keyed retry', (_name, originalCommand) => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_exact',
        originalCommand
      })
    ) as RuntimeClientError

    expect(
      (result.data as { recovery?: { retryCommand?: string[] } }).recovery?.retryCommand
    ).toEqual([...originalCommand, '--retry-request', 'request_exact'])
  })

  it('reuses the request identity without duplicating an existing retry flag', () => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_reused',
        originalCommand: [
          'h0x',
          'orchestration',
          'worker-retain',
          '--dispatch',
          'dispatch_1',
          '--retry-request=request_reused'
        ]
      })
    ) as RuntimeClientError

    expect(
      (result.data as { recovery?: { retryCommand?: string[] } }).recovery?.retryCommand
    ).toEqual([
      'h0x',
      'orchestration',
      'worker-retain',
      '--dispatch',
      'dispatch_1',
      '--retry-request',
      'request_reused'
    ])
  })

  it('renders Windows cmd recovery guidance without quote drift or percent expansion', () => {
    expect(
      renderCommand(
        ['h0x', 'orchestration', 'worker-start', '--comment', 'literal "quoted" %PATH% & safe'],
        'win32',
        { ComSpec: 'C:\\Windows\\System32\\cmd.exe' }
      )
    ).toBe(
      '"h0x" "orchestration" "worker-start" "--comment" "literal ""quoted"" "^%"PATH"^%" & safe"'
    )
  })

  it('keeps PowerShell and POSIX recovery guidance literal', () => {
    expect(
      renderCommand(['h0x', 'literal "quoted" $HOME'], 'win32', {
        ComSpec: 'powershell.exe'
      })
    ).toBe("& 'h0x' 'literal \\\"quoted\\\" $HOME'")
    expect(renderCommand(['h0x', 'literal $(do-not-run)'], 'darwin')).toBe(
      "h0x 'literal $(do-not-run)'"
    )
  })

  it.runIf(process.platform !== 'win32')(
    'round trips POSIX recovery argv through /bin/sh',
    async () => {
      const values = ['with spaces', "apostrophe's", 'literal $(do-not-run)', 'line one\nline two']
      const command = renderCommand(
        [
          process.execPath,
          '-e',
          'process.stdout.write(JSON.stringify(process.argv.slice(1)))',
          ...values
        ],
        'darwin'
      )

      const result = await runProcess({ program: '/bin/sh', args: ['-c', command] })

      expect(result).toMatchObject({ code: 0, stderr: '', timedOut: false })
      expect(JSON.parse(result.stdout)).toEqual(values)
    }
  )

  it.each([
    [
      'split',
      ['h0x', 'orchestration', 'send', '--pairing-code', 'split-secret', '--subject', 'status'],
      'split-secret'
    ],
    [
      'equals',
      ['h0x', 'orchestration', 'send', '--pairing-code=equals-secret', '--subject', 'status'],
      'equals-secret'
    ],
    [
      'dispatch split',
      [
        'orca',
        'orchestration',
        'send',
        '--dispatch-capability',
        'split-dispatch-secret',
        '--subject',
        'status'
      ],
      'split-dispatch-secret'
    ],
    [
      'dispatch equals',
      [
        'orca',
        'orchestration',
        'send',
        '--dispatch-capability=equals-dispatch-secret',
        '--subject',
        'status'
      ],
      'equals-dispatch-secret'
    ]
  ])('blocks recovery and removes %s credentials', (_name, originalCommand, secret) => {
    const result = orchestrationMutationRecoveryError(
      new RuntimeClientError('runtime_timeout', 'request timed out', {
        orchestrationRequestId: 'request_secret',
        originalCommand
      })
    ) as RuntimeClientError
    const output = JSON.stringify({ message: result.message, data: result.data })

    expect(output).not.toContain(secret)
    expect(result.message).toContain('Recovery is blocked')
    expect(result.data).toMatchObject({
      recovery: {
        orchestrationRequestId: 'request_secret',
        recoveryBlocked: true
      }
    })
    expect(result.data).not.toHaveProperty('originalCommand')
    expect((result.data as { recovery: object }).recovery).not.toHaveProperty('retryCommand')
  })
})
