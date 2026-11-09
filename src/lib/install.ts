import { INSTALL_PROMPT_STORAGE_KEY } from './constants';
import type { LocationPlatform } from './geolocation';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

export interface InstallPromptConditions {
  enabled: boolean;
  seen: boolean;
  standalone: boolean;
  platform: LocationPlatform;
}

/** The install invitation is Android-only and is never repeated once shown. */
export function shouldOfferInstallPrompt({
  enabled,
  seen,
  standalone,
  platform,
}: InstallPromptConditions): boolean {
  return enabled && !seen && !standalone && platform === 'android';
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  const displayMode =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return displayMode || iosStandalone;
}

export function hasSeenInstallPrompt(): boolean {
  try {
    return localStorage.getItem(INSTALL_PROMPT_STORAGE_KEY) === 'seen';
  } catch {
    return false;
  }
}

export function markInstallPromptSeen(): void {
  try {
    localStorage.setItem(INSTALL_PROMPT_STORAGE_KEY, 'seen');
  } catch {
    // Storage can be unavailable in private browsing. The prompt still closes for this session.
  }
}
