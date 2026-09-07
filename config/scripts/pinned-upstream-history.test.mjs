import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  preparePinnedUpstreamHistory,
  validatePinnedHistoryManifest
} from './prepare-pinned-upstream-history.mjs'

const manifest = JSON.parse(readFileSync('config/pinned-upstream-history.json', 'utf8'))
const skill = manifest.refs[0]

function fakeGit({ remoteTag = skill.tagObjectSha, remoteCommit = skill.peeledCommitSha } = {}) {
  const calls = []
  let local = null
  const runGit = (args) => {
    calls.push(args)
    if (args[0] === 'ls-remote') {
      const direct = `refs/tags/${skill.tag}`
      return `${remoteTag}\t${direct}\n${remoteCommit}\t${direct}^{}`
    }
    if (args[0] === 'fetch') {
      local = skill.tagObjectSha
      return ''
    }
    if (args[0] === 'cat-file') {
      return 'tag'
    }
    if (args[0] === 'rev-parse' && args.includes('--verify')) {
      if (local === null) {
        throw new Error('missing ref')
      }
      return local
    }
    if (args[0] === 'rev-parse' && args[1].endsWith('^{commit}')) {
      return skill.peeledCommitSha
    }
    if (args[0] === 'rev-parse') {
      return local ?? skill.tagObjectSha
    }
    throw new Error(`Unexpected git call: ${args.join(' ')}`)
  }
  return { calls, runGit }
}

describe('pinned upstream history', () => {
  it('pins the approved annotated tag objects and peeled commits', () => {
    expect(validatePinnedHistoryManifest(manifest)).toEqual(manifest)
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      upstream: {
        repository: 'stablyai/orca',
        url: 'https://github.com/stablyai/orca.git'
      },
      refs: [
        {
          id: 'skill_roundtrip',
          tag: 'v1.4.178-rc.2',
          tagObjectSha: 'ffe3aa9defdd041d21624468ffd2917b13b98d3a',
          peeledCommitSha: '00f0c44a23c84f19975fe73fa172bd8ef81f5903'
        },
        {
          id: 'browser_placement',
          tag: 'v1.4.184',
          tagObjectSha: '284a244a12dfe266f62c103cc6b1b1d13203e0b4',
          peeledCommitSha: '2307f2ebbe1c1e737c0b12d920bb0a208332db2c'
        },
        {
          id: 'stable_wire_baseline',
          tag: 'v1.4.190',
          tagObjectSha: '43268cadff07d513a73181741090ece06a364fd6',
          peeledCommitSha: '6e4f817101daa18d82824b69243d9079baa9c416'
        }
      ]
    })
  })

  it('fetches only the exact verified tag into the temporary namespace and is idempotent', () => {
    const git = fakeGit()
    const expected = { skill_roundtrip: 'refs/h0x-ci/upstream-tags/v1.4.178-rc.2' }
    expect(preparePinnedUpstreamHistory({ manifest, ids: ['skill_roundtrip'], runGit: git.runGit }))
      .toEqual(expected)
    expect(preparePinnedUpstreamHistory({ manifest, ids: ['skill_roundtrip'], runGit: git.runGit }))
      .toEqual(expected)
    expect(git.calls.filter(([command]) => command === 'ls-remote')).toHaveLength(2)
    expect(git.calls.filter(([command]) => command === 'fetch')).toEqual([
      [
        'fetch',
        '--no-tags',
        '--no-write-fetch-head',
        '--depth=1',
        'https://github.com/stablyai/orca.git',
        '+refs/tags/v1.4.178-rc.2:refs/h0x-ci/upstream-tags/v1.4.178-rc.2'
      ]
    ])
  })

  it.each([
    ['missing tag', { remoteTag: '' }],
    ['moved tag object', { remoteTag: '1'.repeat(40) }],
    ['moved peeled commit', { remoteCommit: '2'.repeat(40) }]
  ])('rejects a %s before fetching', (_name, remote) => {
    const git = fakeGit(remote)
    expect(() =>
      preparePinnedUpstreamHistory({ manifest, ids: ['skill_roundtrip'], runGit: git.runGit })
    ).toThrow(/skill_roundtrip.*v1\.4\.178-rc\.2.*expected tag.*and commit/s)
    expect(git.calls.some(([command]) => command === 'fetch')).toBe(false)
  })

  it('rejects malformed manifests and unknown ids', () => {
    expect(() =>
      validatePinnedHistoryManifest({ ...manifest, schemaVersion: 2 })
    ).toThrow(/schema 1/)
    expect(() =>
      validatePinnedHistoryManifest({ ...manifest, refs: [skill, { ...skill }] })
    ).toThrow(/duplicate id/)
    expect(() =>
      preparePinnedUpstreamHistory({ manifest, ids: ['unknown'], runGit: fakeGit().runGit })
    ).toThrow(/Unknown or empty/)
  })
})
