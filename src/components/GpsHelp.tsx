import { useEffect, useState } from 'react';
import { detectPlatform, type LocationPlatform } from '../lib/geolocation';
import { ChevronIcon } from './icons';

interface GpsHelpProps {
  defaultOpen?: boolean;
  platform?: LocationPlatform;
}

export function GpsHelp({ defaultOpen = false, platform }: GpsHelpProps) {
  const [open, setOpen] = useState(defaultOpen);
  const resolvedPlatform = platform ?? detectPlatform();

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <details
      className="gps-help"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>GPS setting help</span>
        <ChevronIcon size={14} />
      </summary>
      <div className="gps-help-body">
        <p>Browsers cannot change phone settings for you. Allow location in these places:</p>

        {resolvedPlatform === 'ios' ? (
          <ol>
            <li>
              Open <strong>Settings → Privacy &amp; Security → Location Services</strong> and make
              sure Location Services is on.
            </li>
            <li>
              Choose <strong>Safari Websites</strong> (or Chrome) and select{' '}
              <strong>While Using the App</strong>. Turn on <strong>Precise Location</strong>.
            </li>
            <li>
              If it is still blocked, open <strong>Settings → Apps → Safari → Location</strong> and
              choose <strong>Allow</strong> or <strong>Ask</strong>.
            </li>
          </ol>
        ) : resolvedPlatform === 'android' ? (
          <ol>
            <li>
              Open <strong>Settings → Apps → Chrome → Permissions → Location</strong> and choose{' '}
              <strong>Allow while using the app</strong>.
            </li>
            <li>
              Or tap the site controls icon beside the address, open{' '}
              <strong>Permissions → Location</strong>, and allow it for this site.
            </li>
            <li>
              Check that <strong>Location</strong> is enabled in Quick Settings.
            </li>
          </ol>
        ) : (
          <ol>
            <li>
              Click the site controls icon beside the address bar and open{' '}
              <strong>Permissions</strong>.
            </li>
            <li>
              Set <strong>Location</strong> to <strong>Allow</strong>, then reload the page.
            </li>
            <li>Make sure location services are enabled in your computer&apos;s settings.</li>
          </ol>
        )}

        <p className="gps-help-note">
          Return to MarcMyMiles and tap <strong>Check GPS again</strong> or{' '}
          <strong>Start drive detection</strong> after changing the setting.
        </p>
      </div>
    </details>
  );
}
