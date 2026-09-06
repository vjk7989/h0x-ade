export type OrchestrationCliCommand = 'h0x'

export function resolveTerminalOrchestrationCliCommand(_args: {
  connectionId: string | null
  isWsl: boolean | null | undefined
  worktreeId: string
  projectRuntime?: unknown
}): OrchestrationCliCommand {
  return 'h0x'
}
