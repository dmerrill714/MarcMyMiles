import type { InstallPromptController } from '../hooks/useInstallPrompt';
import { CheckIcon, CloseIcon, InstallIcon, LogoMark } from './icons';

interface InstallControlsProps {
  controller: InstallPromptController;
}

const REPOSITORY_URL = 'https://github.com/dmerrill714/MarcMyMiles';

export function InstallButton({ controller }: InstallControlsProps) {
  if (!controller.available) return null;

  return (
    <a
      className="install-trigger"
      href={REPOSITORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Open the MarcMyMiles GitHub repository"
      aria-label="Open the MarcMyMiles GitHub repository"
    >
      <InstallIcon size={15} />
      <span>Add to phone</span>
    </a>
  );
}

export function InstallPrompt({ controller }: InstallControlsProps) {
  const { open, stepsOpen, installing, isIos, hasNativePrompt } = controller;

  if (!open) return null;

  return (
    <aside
      className="install-prompt"
      role="dialog"
      aria-modal="false"
      aria-labelledby="install-title"
    >
      <button
        type="button"
        className="install-close"
        onClick={controller.dismiss}
        aria-label="Close install instructions"
      >
        <CloseIcon size={15} />
      </button>

      <div className="install-head">
        <span className="install-mark" aria-hidden="true">
          <LogoMark size={40} />
        </span>
        <div className="install-copy">
          <span className="eyebrow">One-time invite</span>
          <h2 className="install-title" id="install-title">
            Add MarcMyMiles to your home screen?
          </h2>
          <p className="install-body">
            Install it for full-screen tracking and one-tap access. This is the only automatic
            reminder; use your browser menu if you need the install steps again.
          </p>
        </div>
      </div>

      {stepsOpen && (
        <div className="install-steps" id="install-steps">
          <p className="install-steps-title">
            {isIos ? 'On iPhone or iPad' : 'On Android'}
          </p>
          {isIos ? (
            <ol>
              <li>
                Open this page in <strong>Safari</strong> or <strong>Chrome</strong>.
              </li>
              <li>
                Tap the <strong>Share</strong> button — the square with an arrow pointing up.
              </li>
              <li>
                Scroll down, tap <strong>Add to Home Screen</strong>, then tap{' '}
                <strong>Add</strong>.
              </li>
            </ol>
          ) : (
            <ol>
              <li>
                Open the browser menu using the <strong>⋮</strong> button.
              </li>
              <li>
                Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
              </li>
              <li>Confirm to add MarcMyMiles to your home screen.</li>
            </ol>
          )}
          <p className="install-note">
            Everything stays on this phone. You can close this and use your browser&apos;s menu
            whenever you are ready.
          </p>
        </div>
      )}

      <div className="install-actions">
        {stepsOpen ? (
          <button type="button" className="install-primary" onClick={controller.dismiss}>
            <CheckIcon size={16} />
            Got it
          </button>
        ) : (
          <button
            type="button"
            className="install-primary"
            onClick={() => void controller.install()}
            disabled={installing}
          >
            <InstallIcon size={16} />
            {installing ? 'Opening install…' : hasNativePrompt ? 'Install MarcMyMiles' : 'Show me how'}
          </button>
        )}
        <button type="button" className="install-secondary" onClick={controller.dismiss}>
          Not now
        </button>
      </div>
    </aside>
  );
}
