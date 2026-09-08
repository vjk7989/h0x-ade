#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export function removeReleaseDebugSigning(source) {
  const buildTypesStart = source.indexOf('buildTypes {')
  if (buildTypesStart === -1) {
    throw new Error('Generated Android build-types block was not found')
  }

  const findBlockEnd = (blockStart) => {
    let depth = 0
    for (let index = blockStart; index < source.length; index += 1) {
      if (source[index] === '{') {
        depth += 1
      }
      if (source[index] === '}') {
        depth -= 1
      }
      if (depth === 0) {
        return index
      }
    }
    return -1
  }

  const buildTypesOpen = source.indexOf('{', buildTypesStart)
  const buildTypesEnd = findBlockEnd(buildTypesOpen)
  if (buildTypesEnd === -1) {
    throw new Error('Generated Android build-types block is incomplete')
  }
  const releaseStart = source.indexOf('release {', buildTypesOpen + 1)
  if (releaseStart === -1 || releaseStart > buildTypesEnd) {
    throw new Error('Generated Android release block was not found inside build types')
  }
  const duplicateRelease = source.indexOf('release {', releaseStart + 1)
  if (duplicateRelease !== -1 && duplicateRelease < buildTypesEnd) {
    throw new Error('Generated Android build types contain multiple release blocks')
  }
  const blockStart = source.indexOf('{', releaseStart)
  const blockEnd = findBlockEnd(blockStart)
  if (blockEnd === -1) {
    throw new Error('Generated Android release block is incomplete')
  }
  const block = source.slice(blockStart + 1, blockEnd)
  const signingLine = /^[ \t]*signingConfig signingConfigs\.debug[ \t]*\r?$/gm
  const matches = [...block.matchAll(signingLine)]
  if (matches.length !== 1) {
    throw new Error(`Expected one generated release debug-signing line; found ${matches.length}`)
  }
  const unsignedBlock = block.replace(signingLine, '')
  return `${source.slice(0, blockStart + 1)}${unsignedBlock}${source.slice(blockEnd)}`
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const buildFile = path.resolve(process.argv[2] ?? 'android/app/build.gradle')
  writeFileSync(buildFile, removeReleaseDebugSigning(readFileSync(buildFile, 'utf8')))
  console.log(`Disabled release signing in ${buildFile}`)
}
