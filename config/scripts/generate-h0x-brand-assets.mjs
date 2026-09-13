#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { PNG } from 'pngjs'
import { encodeIco, encodePng, resizeImage } from './trim-windows-icon-source.mjs'

export const SOURCE_SHA256 = 'D54E012E3A323D284E5CF0AB9A41522F89A92B3AA3DF4D10316E5A06B267B6F8'
export const SOURCE_SIZE = 1254
export const APP_TILE_CORNER_RADIUS_RATIO = 0.125
const APP_TILE_ANTIALIAS_GRID_SIZE = 4
const BACKGROUND_NOISE_MAX_INK = 8
const FOREGROUND_MIN_INK = 247
const ICO_FRAME_SIZES = [256, 128, 64, 48, 32, 16]
export const LINUX_ICON_SIZES = [16, 24, 32, 48, 64, 96, 128, 256, 512]

const repoRoot = resolve(import.meta.dirname, '../..')
const sourcePath = join(repoRoot, 'resources', 'brand', 'h0x-mark-source.png')

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase()
}

function decodeSource(buffer) {
  if (sha256(buffer) !== SOURCE_SHA256) {
    throw new Error(`Unexpected h0x logo source SHA-256: ${sha256(buffer)}`)
  }
  const png = PNG.sync.read(buffer)
  if (png.width !== SOURCE_SIZE || png.height !== SOURCE_SIZE) {
    throw new Error(`Expected ${SOURCE_SIZE}x${SOURCE_SIZE} h0x logo source`)
  }
  return { width: png.width, height: png.height, data: png.data }
}

export function createCoverageMask(source) {
  const data = Buffer.alloc(source.width * source.height * 4)
  for (let index = 0; index < source.data.length; index += 4) {
    const luminance = Math.round(
      (source.data[index] * 299 + source.data[index + 1] * 587 + source.data[index + 2] * 114) /
        1000
    )
    const ink = 255 - luminance
    const alpha = ink <= BACKGROUND_NOISE_MAX_INK ? 0 : ink >= FOREGROUND_MIN_INK ? 255 : ink
    data[index + 3] = alpha
  }
  return { width: source.width, height: source.height, data }
}

function colorize(mask, rgb) {
  const data = Buffer.alloc(mask.data.length)
  for (let index = 0; index < mask.data.length; index += 4) {
    data[index] = rgb
    data[index + 1] = rgb
    data[index + 2] = rgb
    data[index + 3] = mask.data[index + 3]
  }
  return { width: mask.width, height: mask.height, data }
}

function composite(image, rgb) {
  const data = Buffer.alloc(image.data.length)
  for (let index = 0; index < image.data.length; index += 4) {
    const alpha = image.data[index + 3] / 255
    data[index] = Math.round(image.data[index] * alpha + rgb * (1 - alpha))
    data[index + 1] = Math.round(image.data[index + 1] * alpha + rgb * (1 - alpha))
    data[index + 2] = Math.round(image.data[index + 2] * alpha + rgb * (1 - alpha))
    data[index + 3] = 255
  }
  return { width: image.width, height: image.height, data }
}

function roundedRectangleCoverage(x, y, width, height, radius) {
  if ((x >= radius && x + 1 <= width - radius) || (y >= radius && y + 1 <= height - radius)) {
    return 255
  }
  let insideSamples = 0
  const gridSize = APP_TILE_ANTIALIAS_GRID_SIZE
  for (let sampleY = 0; sampleY < gridSize; sampleY++) {
    const pointY = y + (sampleY + 0.5) / gridSize
    const closestY = Math.max(radius, Math.min(height - radius, pointY))
    for (let sampleX = 0; sampleX < gridSize; sampleX++) {
      const pointX = x + (sampleX + 0.5) / gridSize
      const closestX = Math.max(radius, Math.min(width - radius, pointX))
      const deltaX = pointX - closestX
      const deltaY = pointY - closestY
      if (deltaX * deltaX + deltaY * deltaY <= radius * radius) {
        insideSamples++
      }
    }
  }
  return Math.round((insideSamples * 255) / (gridSize * gridSize))
}

export function compositeOnRoundedAppTile(image) {
  if (image.width !== image.height) {
    throw new Error('h0x application tile must be square')
  }
  const radius = image.width * APP_TILE_CORNER_RADIUS_RATIO
  const data = Buffer.alloc(image.data.length)
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4
      const tileAlpha = roundedRectangleCoverage(x, y, image.width, image.height, radius)
      if (tileAlpha === 0) {
        continue
      }
      const channel = Math.round(255 * (1 - image.data[index + 3] / 255))
      data[index] = channel
      data[index + 1] = channel
      data[index + 2] = channel
      data[index + 3] = tileAlpha
    }
  }
  return { width: image.width, height: image.height, data }
}

function clearCornerPixels(image) {
  for (const [x, y] of [
    [0, 0],
    [image.width - 1, 0],
    [0, image.height - 1],
    [image.width - 1, image.height - 1]
  ]) {
    image.data.fill(0, (y * image.width + x) * 4, (y * image.width + x) * 4 + 4)
  }
  return image
}

function resizeRoundedAppTile(image, size) {
  return clearCornerPixels(resizeImage(image, size, size))
}

function opaqueBounds(image) {
  let minX = image.width
  let minY = image.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (image.data[(y * image.width + x) * 4 + 3] === 0) {
        continue
      }
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) {
    throw new Error('h0x logo source contains no visible mark')
  }
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

function crop(image, bounds) {
  const data = Buffer.alloc(bounds.width * bounds.height * 4)
  for (let y = 0; y < bounds.height; y++) {
    const start = ((bounds.minY + y) * image.width + bounds.minX) * 4
    image.data.copy(data, y * bounds.width * 4, start, start + bounds.width * 4)
  }
  return { width: bounds.width, height: bounds.height, data }
}

function fit(image, width, height, margin) {
  const scale = Math.min((width - margin * 2) / image.width, (height - margin * 2) / image.height)
  const fittedWidth = Math.max(1, Math.round(image.width * scale))
  const fittedHeight = Math.max(1, Math.round(image.height * scale))
  const fitted = resizeImage(image, fittedWidth, fittedHeight)
  const data = Buffer.alloc(width * height * 4)
  const offsetX = Math.floor((width - fittedWidth) / 2)
  const offsetY = Math.floor((height - fittedHeight) / 2)
  for (let y = 0; y < fittedHeight; y++) {
    fitted.data.copy(
      data,
      ((offsetY + y) * width + offsetX) * 4,
      y * fittedWidth * 4,
      (y + 1) * fittedWidth * 4
    )
  }
  return { width, height, data }
}

export function generateBrandAssetBuffers(sourceBuffer) {
  const source = decodeSource(sourceBuffer)
  const mask = createCoverageMask(source)
  const black = colorize(mask, 0)
  const white = colorize(mask, 255)
  const black1024 = resizeImage(black, 1024, 1024)
  const white1024 = resizeImage(white, 1024, 1024)
  const squareApp1024 = composite(black1024, 255)
  const roundedApp1024 = compositeOnRoundedAppTile(black1024)
  const app256 = resizeRoundedAppTile(roundedApp1024, 256)
  const croppedWhite = crop(white, opaqueBounds(white))
  const tray1x = fit(croppedWhite, 22, 14, 1)
  const tray2x = fit(croppedWhite, 44, 28, 2)
  const splash = resizeImage(white, 400, 400)
  const mobileFavicon = resizeImage(squareApp1024, 48, 48)
  const windowsFrames = ICO_FRAME_SIZES.map((size) => resizeRoundedAppTile(roundedApp1024, size))
  const faviconFrames = [48, 32, 16].map((size) => resizeRoundedAppTile(roundedApp1024, size))

  const assets = new Map([
    ['resources/brand/h0x-mark-source.png', sourceBuffer],
    ['resources/brand/h0x-mark-black.png', encodePng(black1024)],
    ['resources/brand/h0x-mark-white.png', encodePng(white1024)],
    ['resources/build/icon.png', encodePng(roundedApp1024)],
    ['resources/build/icon.ico', encodeIco(windowsFrames)],
    ['resources/icon.png', encodePng(app256)],
    ['resources/icon-dev.png', encodePng(app256)],
    ['resources/icon-source/icon.icon/Assets/logo.png', encodePng(roundedApp1024)],
    ['resources/tray/h0x-menu-barTemplate.png', encodePng(tray1x)],
    ['resources/tray/h0x-menu-barTemplate@2x.png', encodePng(tray2x)],
    ['mobile/assets/icon.png', encodePng(squareApp1024)],
    ['mobile/assets/adaptive-icon.png', encodePng(white1024)],
    ['mobile/assets/splash-icon.png', encodePng(splash)],
    ['mobile/assets/favicon.png', encodePng(mobileFavicon)],
    ['docs/site/public/docs/logo.png', encodePng(resizeImage(white, 256, 256))],
    ['docs/site/public/docs/favicon.ico', encodeIco(faviconFrames)]
  ])
  for (const size of LINUX_ICON_SIZES) {
    assets.set(
      `resources/build/linux-icons/${size}x${size}.png`,
      encodePng(resizeRoundedAppTile(roundedApp1024, size))
    )
  }
  return assets
}

export function syncBrandAssets({ check = false } = {}) {
  const source = readFileSync(sourcePath)
  const assets = generateBrandAssetBuffers(source)
  const stale = []
  for (const [relativePath, buffer] of assets) {
    const outputPath = join(repoRoot, relativePath)
    if (existsSync(outputPath) && readFileSync(outputPath).equals(buffer)) {
      continue
    }
    if (check) {
      stale.push(relativePath)
      continue
    }
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, buffer)
  }
  if (stale.length > 0) {
    throw new Error(`Stale generated h0x brand assets:\n${stale.join('\n')}`)
  }
  return assets
}

if (resolve(process.argv[1] ?? '') === resolve(import.meta.filename)) {
  syncBrandAssets({ check: process.argv.includes('--check') })
}
