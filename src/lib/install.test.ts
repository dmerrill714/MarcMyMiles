import { describe, expect, it } from 'vitest';
import { shouldOfferInstallPrompt, type InstallPromptConditions } from './install';

const eligible: InstallPromptConditions = {
  enabled: true,
  seen: false,
  standalone: false,
  platform: 'android',
};

describe('install prompt', () => {
  it('offers installation once setup is complete on Android', () => {
    expect(shouldOfferInstallPrompt(eligible)).toBe(true);
    expect(shouldOfferInstallPrompt({ ...eligible, platform: 'ios' })).toBe(false);
  });

  it('never repeats after the invitation has been shown', () => {
    expect(shouldOfferInstallPrompt({ ...eligible, seen: true })).toBe(false);
  });

  it('stays hidden inside the installed app', () => {
    expect(shouldOfferInstallPrompt({ ...eligible, standalone: true })).toBe(false);
  });

  it('waits for setup and does not target desktop browsers', () => {
    expect(shouldOfferInstallPrompt({ ...eligible, enabled: false })).toBe(false);
    expect(shouldOfferInstallPrompt({ ...eligible, platform: 'other' })).toBe(false);
  });
});
