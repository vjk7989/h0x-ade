// @vitest-environment happy-dom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CliFeatureTipVisual } from './CliFeatureTipVisual'

vi.mock('@/components/feature-wall/AgentsOrchestrationVisual', () => ({
  AgentsOrchestrationVisual: () => null
}))

vi.mock('@/components/feature-wall/feature-wall-modal-helpers', () => ({
  usePrefersReducedMotion: () => true
}))

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

afterEach(cleanup)

describe('CLI feature-tip visual brand contract', () => {
  it('shows only canonical h0x commands', () => {
    const { container } = render(<CliFeatureTipVisual />)
    const text = container.textContent ?? ''

    expect(text).toContain('h0x worktree create --name auth-pr-1')
    expect(text).toContain('h0x worktree create --name auth-pr-2')
    expect(text).toContain('h0x orchestration dispatch --task pr1 --to w1')
    expect(text).toContain('h0x orchestration dispatch --task pr2 --to w2')
    expect(text).not.toMatch(/\borca(?:-dev|-ide)?\b/i)
  })
})
