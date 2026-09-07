import { RuntimeClientError } from '../../runtime-client'

type CompatibilityCliCommand = 'h0x' | 'h0x-dev' | 'orca' | 'orca-dev' | 'orca-ide'

const COMPATIBILITY_CLI_COMMANDS = new Set<CompatibilityCliCommand>([
  'h0x',
  'h0x-dev',
  'orca',
  'orca-dev',
  'orca-ide'
])

export function resolveCompatibilityCliCommand(): CompatibilityCliCommand {
  const configured = process.env.ORCA_CLI_COMMAND
  if (COMPATIBILITY_CLI_COMMANDS.has(configured as CompatibilityCliCommand)) {
    return configured as CompatibilityCliCommand
  }
  return 'h0x'
}

export function resolvePackagedWindowsCompatibilityCommand():
  | 'h0x'
  | 'orca'
  | 'orca-ide'
  | undefined {
  if (process.env.ORCA_WINDOWS_PACKAGED_CLI_LAUNCHER !== '1') {
    return undefined
  }
  const command = process.env.ORCA_CLI_COMMAND
  if (command === 'h0x' || command === 'orca' || command === 'orca-ide') {
    return command
  }
  throw new RuntimeClientError(
    'invalid_argument',
    'The packaged h0x launcher did not provide a valid resume command. No question was created.'
  )
}

export async function flushOrchestrationStdout(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    process.stdout.write('', (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

export function isDevCliInvocation(): boolean {
  return (
    process.env.ORCA_DEV_CLI_INVOCATION === '1' ||
    (process.env.ORCA_USER_DATA_PATH?.includes('h0x-dev') ?? false) ||
    (process.env.ORCA_USER_DATA_PATH?.includes('orca-dev') ?? false)
  )
}
