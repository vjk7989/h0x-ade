#!/usr/bin/env node
import { appendFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const MANIFEST_PATH = 'config/pinned-upstream-history.json'
const UPSTREAM_URL = 'https://github.com/stablyai/orca.git'
const TEMP_REF_PREFIX = 'refs/h0x-ci/upstream-tags/'
const SHA_PATTERN = /^[0-9a-f]{40}$/
const TAG_PATTERN = /^v\d+\.\d+\.\d+(?:-rc\.\d+)?$/
const ID_PATTERN = /^[a-z][a-z0-9_]*$/

export function validatePinnedHistoryManifest(value) {
  if (value?.schemaVersion !== 1 || value?.upstream?.url !== UPSTREAM_URL) {
    throw new Error(`Pinned history manifest must use schema 1 and ${UPSTREAM_URL}`)
  }
  if (value.upstream.repository !== 'stablyai/orca' || !Array.isArray(value.refs)) {
    throw new Error('Pinned history manifest has an invalid upstream repository or refs list')
  }
  const ids = new Set()
  const tags = new Set()
  for (const entry of value.refs) {
    if (!ID_PATTERN.test(entry?.id ?? '') || ids.has(entry.id)) {
      throw new Error(`Pinned history manifest has an invalid or duplicate id: ${entry?.id}`)
    }
    if (!TAG_PATTERN.test(entry?.tag ?? '') || tags.has(entry.tag)) {
      throw new Error(`Pinned history manifest has an invalid or duplicate tag: ${entry?.tag}`)
    }
    if (
      !SHA_PATTERN.test(entry?.tagObjectSha ?? '') ||
      !SHA_PATTERN.test(entry?.peeledCommitSha ?? '') ||
      entry.tagObjectSha === entry.peeledCommitSha
    ) {
      throw new Error(`Pinned history manifest has invalid object IDs for ${entry.id}`)
    }
    ids.add(entry.id)
    tags.add(entry.tag)
  }
  return value
}

function defaultRunGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim()
}

function localRef(runGit, ref) {
  try {
    return runGit(['rev-parse', '--verify', '--quiet', ref])
  } catch {
    return null
  }
}

function verifyLocalRef(runGit, entry, ref) {
  const type = runGit(['cat-file', '-t', ref])
  const object = runGit(['rev-parse', ref])
  const peeled = runGit(['rev-parse', `${ref}^{commit}`])
  if (type !== 'tag' || object !== entry.tagObjectSha || peeled !== entry.peeledCommitSha) {
    throw new Error(
      `Pinned history ${entry.id} (${entry.tag}) local ref mismatch: expected tag ${entry.tagObjectSha} ` +
        `and commit ${entry.peeledCommitSha}; got type ${type}, tag ${object}, commit ${peeled}`
    )
  }
}

function verifyRemoteTag(runGit, manifest, entry) {
  const directRef = `refs/tags/${entry.tag}`
  const peeledRef = `${directRef}^{}`
  const output = runGit(['ls-remote', '--tags', manifest.upstream.url, directRef, peeledRef])
  const rows = output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
  const direct = rows.filter(([, ref]) => ref === directRef).map(([sha]) => sha)
  const peeled = rows.filter(([, ref]) => ref === peeledRef).map(([sha]) => sha)
  if (
    direct.length !== 1 ||
    peeled.length !== 1 ||
    direct[0] !== entry.tagObjectSha ||
    peeled[0] !== entry.peeledCommitSha
  ) {
    throw new Error(
      `Pinned history ${entry.id} (${entry.tag}) remote mismatch: expected tag ${entry.tagObjectSha} ` +
        `and commit ${entry.peeledCommitSha}; got tag ${direct[0] ?? 'missing'}, ` +
        `commit ${peeled[0] ?? 'missing'}`
    )
  }
}

export function preparePinnedUpstreamHistory({ manifest, ids, runGit = defaultRunGit }) {
  const validated = validatePinnedHistoryManifest(manifest)
  const requested = new Set(ids)
  const selected = validated.refs.filter((entry) => requested.delete(entry.id))
  if (requested.size > 0 || selected.length === 0) {
    throw new Error(`Unknown or empty pinned history ids: ${[...requested].join(',') || '(none)'}`)
  }
  const outputs = {}
  for (const entry of selected) {
    verifyRemoteTag(runGit, validated, entry)
    const ref = `${TEMP_REF_PREFIX}${entry.tag}`
    const existing = localRef(runGit, ref)
    if (existing === null) {
      runGit([
        'fetch',
        '--no-tags',
        '--no-write-fetch-head',
        '--depth=1',
        validated.upstream.url,
        `+refs/tags/${entry.tag}:${ref}`
      ])
    }
    verifyLocalRef(runGit, entry, ref)
    outputs[entry.id] = ref
  }
  return outputs
}

function option(name) {
  return process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ids = (option('ids') ?? '').split(',').filter(Boolean)
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  const outputs = preparePinnedUpstreamHistory({ manifest, ids })
  for (const [id, ref] of Object.entries(outputs)) {
    console.log(`[pinned-upstream-history] ${id}=${ref}`)
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${id}=${ref}\n`)
    }
  }
}
