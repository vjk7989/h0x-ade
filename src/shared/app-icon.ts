export const APP_ICON_OPTIONS = [{ id: 'classic', label: 'h0x-ADE' }] as const

export type AppIconId = (typeof APP_ICON_OPTIONS)[number]['id']

export const DEFAULT_APP_ICON_ID: AppIconId = 'classic'

export function normalizeAppIconId(value: unknown): AppIconId {
  return value === 'classic' ? value : DEFAULT_APP_ICON_ID
}
