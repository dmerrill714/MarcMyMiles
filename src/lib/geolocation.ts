export type LocationPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported'
  | 'unknown'
  | 'error';

export type LocationPlatform = 'ios' | 'android' | 'other';

export interface LocationAccessResult {
  state: LocationPermissionState;
  accuracyMeters: number | null;
  message: string | null;
}

const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20_000,
};

export function detectPlatform(): LocationPlatform {
  if (typeof navigator === 'undefined') return 'other';

  const userAgent = navigator.userAgent;
  const isIPadOnMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  if (/iPad|iPhone|iPod/i.test(userAgent) || isIPadOnMac) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'other';
}

export async function readLocationPermission(): Promise<LocationPermissionState> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return 'unsupported';
  }

  if (!navigator.permissions || typeof navigator.permissions.query !== 'function') {
    return 'unknown';
  }

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
      return status.state;
    }
  } catch {
    return 'unknown';
  }

  return 'unknown';
}

export function requestLocationAccess(): Promise<LocationAccessResult> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve({
      state: 'unsupported',
      accuracyMeters: null,
      message: 'This browser does not support location access.',
    });
  }

  return new Promise((resolve) => {
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            state: 'granted',
            accuracyMeters: Number.isFinite(position.coords.accuracy)
              ? Math.round(position.coords.accuracy)
              : null,
            message: null,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve({
              state: 'denied',
              accuracyMeters: null,
              message: 'Location permission was blocked. Use the setting steps below to allow it.',
            });
            return;
          }

          resolve({
            state: 'error',
            accuracyMeters: null,
            message:
              error.code === error.TIMEOUT
                ? 'GPS timed out. Move near a window or step outside, then try again.'
                : 'GPS is unavailable right now. Check that Location Services is turned on.',
          });
        },
        LOCATION_OPTIONS,
      );
    } catch {
      resolve({
        state: 'error',
        accuracyMeters: null,
        message: 'GPS could not be started on this browser.',
      });
    }
  });
}
