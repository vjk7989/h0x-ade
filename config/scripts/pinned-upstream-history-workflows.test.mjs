import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const pr = parse(readFileSync('.github/workflows/pr.yml', 'utf8'))
const skills = parse(readFileSync('.github/workflows/skill-update-roundtrip.yml', 'utf8'))
const community = parse(readFileSync('.github/workflows/track-community-prs.yaml', 'utf8'))

describe('pinned upstream history workflow contracts', () => {
  it('prepares exact temporary refs for cross-version tests', () => {
    const steps = pr.jobs['cross-version-wire'].steps
    const checkout = steps.find((step) => step.name === 'Checkout')
    const prepare = steps.find((step) => step.id === 'pinned-history')
    const install = steps.find((step) => step.uses === './.github/actions/install-node-dependencies')
    const journey = steps.find((step) => step.name === 'Old/new client and server compatibility journeys')
    expect(checkout.with).toMatchObject({
      'fetch-depth': 0,
      'fetch-tags': false,
      filter: 'blob:none',
      'persist-credentials': false
    })
    expect(prepare.run).toContain('--ids=browser_placement,stable_wire_baseline')
    expect(steps.indexOf(prepare)).toBeLessThan(steps.indexOf(install))
    expect(journey.env).toEqual({
      ORCA_CROSS_VERSION_BASELINE_REF: '${{ steps.pinned-history.outputs.stable_wire_baseline }}',
      ORCA_CROSS_VERSION_BROWSER_PLACEMENT_REF:
        '${{ steps.pinned-history.outputs.browser_placement }}',
      ORCA_CROSS_VERSION_TERMINAL_METADATA_REF:
        '${{ steps.pinned-history.outputs.stable_wire_baseline }}'
    })
  })

  it('prepares the pinned skill ref in every one of the thirteen matrix cells', () => {
    const job = skills.jobs.roundtrip
    const steps = job.steps
    const prepare = steps.find((step) => step.id === 'pinned-history')
    const verify = steps.find((step) => step.name === 'Verify targeted update convergence and copy behavior')
    const axes = job.strategy.matrix
    const cells = axes.os.length * axes.shape.length * axes.autocrlf.length * axes['skills-cli'].length
    expect(cells + axes.include.length).toBe(13)
    expect(prepare.run).toContain('--ids=skill_roundtrip')
    expect(steps.indexOf(prepare)).toBeLessThan(steps.indexOf(verify))
    expect(verify.run).toContain(
      '--historical-ref=${{ steps.pinned-history.outputs.skill_roundtrip }}'
    )
    const checkout = steps.find((step) => step.uses === 'actions/checkout@v6')
    expect(checkout.with['fetch-depth']).toBe(1)
    expect(checkout.with['fetch-tags']).toBe(false)
    expect(checkout.with['persist-credentials']).toBe(false)
  })

  it('skips the upstream-only community project job on this fork', () => {
    expect(community.jobs['track-community-pr'].if).toBe("github.repository == 'stablyai/orca'")
    expect(community.jobs['track-community-pr'].steps[0].uses).toBe(
      'actions/create-github-app-token@v3'
    )
  })
})
