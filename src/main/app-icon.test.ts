import { describe, expect, it, vi } from 'vitest'

const {
  browserWindowGetAllWindowsMock,
  createFromPathMock,
  dockSetIconMock,
  isMock,
  windowSetIconMock
} = vi.hoisted(() => ({
  browserWindowGetAllWindowsMock: vi.fn(),
  createFromPathMock: vi.fn(),
  dockSetIconMock: vi.fn(),
  isMock: { dev: false },
  windowSetIconMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: { dock: { setIcon: dockSetIconMock } },
  BrowserWindow: { getAllWindows: browserWindowGetAllWindowsMock },
  nativeImage: { createFromPath: createFromPathMock }
}))
vi.mock('@electron-toolkit/utils', () => ({ is: isMock }))
vi.mock('../../resources/icon.png?asset', () => ({ default: 'classic-icon' }))
vi.mock('../../resources/icon-dev.png?asset', () => ({ default: 'classic-dev-icon' }))

import { applyAppIcon, getAppIconPath, persistMacDockIcon } from './app-icon'

function waitForQueue(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

describe('canonical app icon', () => {
  it('maps legacy and malformed selections to the canonical icon', () => {
    expect(getAppIconPath('classic')).toBe('classic-icon')
    expect(getAppIconPath('watercolor')).toBe('classic-icon')
    expect(getAppIconPath('blue')).toBe('classic-icon')
    expect(getAppIconPath('missing')).toBe('classic-icon')
  })

  it('applies the canonical icon to live windows', () => {
    const image = { isEmpty: () => false }
    createFromPathMock.mockReturnValue(image)
    browserWindowGetAllWindowsMock.mockReturnValue([
      { isDestroyed: () => false, setIcon: windowSetIconMock },
      { isDestroyed: () => true, setIcon: vi.fn() }
    ])

    applyAppIcon('watercolor')

    expect(createFromPathMock).toHaveBeenCalledWith('classic-icon')
    expect(windowSetIconMock).toHaveBeenCalledWith(image)
  })

  it('clears legacy macOS custom-icon metadata', async () => {
    const execFile = vi.fn(
      (
        _file: string,
        _args: string[],
        optionsOrCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        const complete =
          typeof optionsOrCallback === 'function'
            ? (optionsOrCallback as (error: Error | null) => void)
            : callback
        complete?.(null)
      }
    )

    persistMacDockIcon('blue', {
      appBundlePath: '/Applications/h0x-ADE.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueue()

    expect(execFile).toHaveBeenNthCalledWith(
      1,
      '/usr/bin/osascript',
      expect.arrayContaining(['-e', expect.stringContaining('setIcon:(missing value)')]),
      expect.objectContaining({
        env: expect.objectContaining({ ORCA_APP_BUNDLE_PATH: '/Applications/h0x-ADE.app' })
      }),
      expect.any(Function)
    )
    expect(execFile).toHaveBeenCalledWith(
      '/usr/bin/xattr',
      ['-d', 'com.apple.FinderInfo', '/Applications/h0x-ADE.app'],
      expect.any(Object),
      expect.any(Function)
    )
    expect(execFile).toHaveBeenCalledWith(
      '/usr/bin/xattr',
      ['-d', 'com.apple.ResourceFork', '/Applications/h0x-ADE.app'],
      expect.any(Object),
      expect.any(Function)
    )
  })

  it('does not persist metadata outside packaged macOS apps', async () => {
    const execFile = vi.fn()
    persistMacDockIcon('classic', {
      appBundlePath: '/Applications/h0x-ADE.app',
      execFile,
      isDevApp: true,
      platform: 'darwin'
    })
    persistMacDockIcon('classic', {
      appBundlePath: '/Applications/h0x-ADE.app',
      execFile,
      isDevApp: false,
      platform: 'win32'
    })
    await waitForQueue()
    expect(execFile).not.toHaveBeenCalled()
  })
})
