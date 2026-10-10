export const SETTINGS_TAB_IDS = [
  "profile",
  "appearance",
  "general",
  "ai",
  "credentials",
  "integrations",
  "danger",
] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

export function isSettingsTabId(value: string): value is SettingsTabId {
  return (SETTINGS_TAB_IDS as readonly string[]).includes(value);
}

export function settingsTabHref(tabId: SettingsTabId): string {
  return `/app/settings?tab=${tabId}`;
}

export const DEFAULT_SETTINGS_TAB: SettingsTabId = "profile";
