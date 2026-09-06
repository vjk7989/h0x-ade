export function getOrcaCliCommandNameForPlatform(platform: NodeJS.Platform): string {
  if (platform === 'linux') {
    return 'h0x'
  }
  if (platform === 'win32') {
    return 'h0x.cmd'
  }
  return 'h0x'
}
