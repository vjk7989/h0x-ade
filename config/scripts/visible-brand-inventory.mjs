import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const SOURCE_EXTENSIONS = new Set([
  '.cjs',
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.nsh',
  '.plist',
  '.sh',
  '.swift',
  '.ts',
  '.tsx'
])
const LINE_EXTENSIONS = new Set(['.md', '.mdx', '.toml', '.yaml', '.yml'])
const SCANNED_ROOTS = [
  'src',
  'docs/readme',
  'docs/site',
  'mobile/app',
  'mobile/src',
  'mobile/fastlane',
  'native',
  'resources/plugins',
  'resources/skills',
  'skill-guides',
  'skill-stubs',
  'skills',
  'config/nsis'
]
const SCANNED_FILES = [
  'README.md',
  'config/electron-builder.config.cjs',
  'config/scripts/build-computer-macos.mjs',
  'mobile/app.json',
  'mobile/README.md',
  'mobile/fastlane/Fastfile'
]
const LOCALE_ROOT = 'src/renderer/src/i18n/locales'
const LOCALE_FILES = ['en.json', 'es.json', 'fr.json', 'ja.json', 'ko.json', 'zh.json']
const RUNTIME_CATALOG = 'src/renderer/src/i18n/en-runtime-required.json'
const EXEMPTIONS_PATH = 'config/visible-brand-compatibility-exemptions.json'
const IGNORED_DIRECTORIES = new Set([
  '.build',
  '.expo',
  '.git',
  '.next',
  'build',
  'dist',
  'node_modules',
  'out'
])
const IGNORED_FILES = new Set(['src/cli/bundled-skill-guides.ts'])

const STANDALONE_ORCA = /(^|[^\p{L}\p{N}_])Orca(?=$|[^\p{L}\p{N}_])/u
const STANDALONE_ORCA_PLACEHOLDER = /(^|[^\p{L}\p{N}_])ORCA(?=$|[^\p{L}\p{N}_])/u
const STALE_ORCA_COMMAND = /(?:^|[\s`'$>])orca(?:-dev|-ide)?(?=\s+(?:--?[a-z]|[a-z][\w-]*))/

function toRepoPath(value) {
  return value.split(path.sep).join('/')
}

function isScannableFile(relativePath) {
  if (/(?:^|\/)(?:__fixtures__|node_modules)(?:\/|$)/.test(relativePath)) {
    return false
  }
  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relativePath)) {
    return false
  }
  if (/(?:fixture|harness)/i.test(path.basename(relativePath))) {
    return false
  }
  if (relativePath.endsWith('.snap')) {
    return false
  }
  const extension = path.extname(relativePath).toLowerCase()
  return extension === '.json' || SOURCE_EXTENSIONS.has(extension) || LINE_EXTENSIONS.has(extension)
}

function collectFiles(absolutePath, repoRoot, output = []) {
  if (!existsSync(absolutePath)) {
    return output
  }
  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    const fullPath = path.join(absolutePath, entry.name)
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        collectFiles(fullPath, repoRoot, output)
      }
      continue
    }
    const relativePath = toRepoPath(path.relative(repoRoot, fullPath))
    if (!IGNORED_FILES.has(relativePath) && isScannableFile(relativePath)) {
      output.push(relativePath)
    }
  }
  return output
}

function flattenJsonStrings(value, location = '$', output = []) {
  if (typeof value === 'string') {
    output.push({ location, text: value })
    return output
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => flattenJsonStrings(entry, `${location}[${index}]`, output))
    return output
  }
  if (!value || typeof value !== 'object') {
    return output
  }
  for (const key of Object.keys(value).sort()) {
    flattenJsonStrings(value[key], location === '$' ? key : `${location}.${key}`, output)
  }
  return output
}

function lineText(source) {
  return source
    .split(/\r?\n/)
    .map((text, index) => ({ location: `line:${index + 1}`, text: text.trim() }))
    .filter(({ text }) => text && !text.startsWith('<!--'))
}

function sourceLineText(source) {
  return source
    .split(/\r?\n/)
    .map((text, index) => ({ location: `line:${index + 1}`, text: text.trim() }))
    .filter(
      ({ text }) =>
        text && !/^(?:\/\/|\/\*|\*|#|;|<!--)/.test(text) && findBrandReason(text) !== undefined
    )
}

export function findBrandReason(text) {
  if (STANDALONE_ORCA.test(text)) {
    return 'standalone display identity "Orca"'
  }
  if (STANDALONE_ORCA_PLACEHOLDER.test(text)) {
    return 'uppercase legacy documentation placeholder "ORCA"'
  }
  if (STALE_ORCA_COMMAND.test(text)) {
    return 'legacy lowercase `orca` command example'
  }
  return undefined
}

export function exemptionKey({ path: filePath, text }) {
  return `${filePath}\0${text}`
}

export function auditBrandEntries(entries, exemptions) {
  const exemptionByKey = new Map()
  for (const exemption of exemptions) {
    if (!exemption.path || !exemption.text || !exemption.reason) {
      throw new Error('Every visible-brand exemption requires exact path, text, and reason fields.')
    }
    const key = exemptionKey(exemption)
    if (exemptionByKey.has(key)) {
      throw new Error(`Duplicate visible-brand exemption: ${exemption.path}`)
    }
    exemptionByKey.set(key, exemption)
  }

  const used = new Set()
  const violations = []
  for (const entry of entries) {
    const reason = findBrandReason(entry.text)
    if (!reason) {
      continue
    }
    const key = exemptionKey(entry)
    if (exemptionByKey.has(key)) {
      used.add(key)
      continue
    }
    violations.push({ ...entry, reason })
  }

  const unusedExemptions = exemptions.filter((exemption) => !used.has(exemptionKey(exemption)))
  return { unusedExemptions, violations }
}

function collectScannedSourceFiles(repoRoot) {
  const sourceFiles = SCANNED_ROOTS.flatMap((root) =>
    collectFiles(path.join(repoRoot, root), repoRoot)
  )
  for (const configuredFile of SCANNED_FILES) {
    if (existsSync(path.join(repoRoot, configuredFile))) {
      sourceFiles.push(configuredFile)
    }
  }
  return [...new Set(sourceFiles)]
    .filter(
      (relativePath) =>
        relativePath !== RUNTIME_CATALOG && !relativePath.startsWith(`${LOCALE_ROOT}/`)
    )
    .sort()
}

export function collectBrandEntries(repoRoot) {
  const entries = []
  for (const relativePath of collectScannedSourceFiles(repoRoot)) {
    const source = readFileSync(path.join(repoRoot, relativePath), 'utf8')
    const extension = path.extname(relativePath).toLowerCase()
    let candidates
    if (extension === '.json') {
      candidates = flattenJsonStrings(JSON.parse(source))
    } else if (LINE_EXTENSIONS.has(extension)) {
      candidates = lineText(source)
    } else {
      candidates = sourceLineText(source)
    }
    for (const candidate of candidates) {
      if (findBrandReason(candidate.text)) {
        entries.push({ path: relativePath, ...candidate })
      }
    }
  }

  const catalogs = [...LOCALE_FILES.map((name) => `${LOCALE_ROOT}/${name}`), RUNTIME_CATALOG]
  for (const relativePath of catalogs.sort()) {
    const catalog = JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'))
    for (const candidate of flattenJsonStrings(catalog)) {
      if (findBrandReason(candidate.text)) {
        entries.push({ path: relativePath, ...candidate })
      }
    }
  }
  return entries
}

export function auditVisibleBrand(repoRoot) {
  const entries = collectBrandEntries(repoRoot)
  const exemptions = JSON.parse(readFileSync(path.join(repoRoot, EXEMPTIONS_PATH), 'utf8'))
  return {
    entries,
    exemptions,
    scannedFileCount: collectScannedSourceFiles(repoRoot).length + LOCALE_FILES.length + 1,
    ...auditBrandEntries(entries, exemptions)
  }
}

function compact(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function printFindings(label, findings, limit = 100) {
  if (findings.length === 0) {
    return
  }
  console.error(`${label} (${findings.length}):`)
  for (const finding of findings.slice(0, limit)) {
    console.error(`- ${finding.path} [${finding.location ?? 'exemption'}] ${compact(finding.text)}`)
  }
  if (findings.length > limit) {
    console.error(
      `- ... ${findings.length - limit} more; rerun with --json for the complete inventory.`
    )
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === import.meta.filename) {
  const repoRoot = path.resolve(import.meta.dirname, '..', '..')
  const result = auditVisibleBrand(repoRoot)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printFindings('Unapproved visible legacy-brand strings', result.violations)
    printFindings('Unused visible-brand compatibility exemptions', result.unusedExemptions)
  }
  if (result.violations.length > 0 || result.unusedExemptions.length > 0) {
    process.exitCode = 1
  } else {
    console.log(
      `Visible-brand inventory passed across ${result.scannedFileCount} shipped files; ${result.entries.length} exact compatibility matches remain.`
    )
  }
}
