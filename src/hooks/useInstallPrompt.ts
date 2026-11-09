import { useCallback, useEffect, useState } from 'react';
import { detectPlatform } from '../lib/geolocation';
import {
  hasSeenInstallPrompt,
  isStandaloneMode,
  markInstallPromptSeen,
  shouldOfferInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../lib/install';

export interface InstallPromptController {
  available: boolean;
  open: boolean;
  stepsOpen: boolean;
  installing: boolean;
  isIos: boolean;
  hasNativePrompt: boolean;
  start: () => Promise<void>;
  install: () => Promise<void>;
  dismiss: () => void;
}

export function useInstallPrompt(enabled: boolean): InstallPromptController {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [standalone, setStandalone] = useState(isStandaloneMode);
  const platform = detectPlatform();
  const isIos = platform === 'ios';

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      const candidate = event as BeforeInstallPromptEvent;
      if (typeof candidate.prompt !== 'function') return;

      event.preventDefault();
      setInstallEvent(candidate);
    };

    const handleInstalled = () => {
      markInstallPromptSeen();
      setStandalone(true);
      setOpen(false);
      setStepsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    const eligible = shouldOfferInstallPrompt({
      enabled,
      seen: hasSeenInstallPrompt(),
      standalone,
      platform,
    });
    if (!eligible) return;

    const timer = window.setTimeout(() => {
      // Do not show the invitation if it was already seen or dismissed.
      if (hasSeenInstallPrompt()) return;

      // Mark it before showing so an ignored or interrupted prompt is never repeated.
      markInstallPromptSeen();
      setStepsOpen(false);
      setOpen(true);
    }, 1_800);

    return () => window.clearTimeout(timer);
  }, [enabled, platform, standalone]);

  const dismiss = useCallback(() => {
    markInstallPromptSeen();
    setOpen(false);
    setStepsOpen(false);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) {
      setStepsOpen(true);
      setOpen(true);
      return;
    }

    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      if (choice.outcome === 'accepted') setStandalone(true);
      markInstallPromptSeen();
      setOpen(false);
      setStepsOpen(false);
    } catch {
      setInstallEvent(null);
      setStepsOpen(true);
      setOpen(true);
    } finally {
      setInstalling(false);
    }
  }, [installEvent]);

  const start = useCallback(async () => {
    markInstallPromptSeen();
    if (installEvent) {
      await promptInstall();
      return;
    }

    setStepsOpen(true);
    setOpen(true);
  }, [installEvent, promptInstall]);

  const install = useCallback(async () => {
    markInstallPromptSeen();
    if (!installEvent) {
      setStepsOpen(true);
      return;
    }

    await promptInstall();
  }, [installEvent, promptInstall]);

  return {
    available: enabled && !standalone && platform === 'android',
    open,
    stepsOpen,
    installing,
    isIos,
    hasNativePrompt: installEvent !== null,
    start,
    install,
    dismiss,
  };
}
