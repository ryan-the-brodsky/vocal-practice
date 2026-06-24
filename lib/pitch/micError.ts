export type MicErrorReason = 'denied' | 'no-device' | 'in-use' | 'insecure' | 'unknown';

/** Maps a getUserMedia rejection to one of the five canonical reasons. */
export function classifyMicError(err: unknown): MicErrorReason {
  // `window` is undefined in Node/SSR; treat as secure so only the DOMException name drives classification.
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'insecure';

  const name = err instanceof DOMException ? err.name : null;

  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-device';
  if (name === 'NotReadableError' || name === 'AbortError') return 'in-use';

  return 'unknown';
}

export interface MicErrorCopy {
  title: string;
  body: string;
  steps?: string[];
}

/** Returns friendly, web-appropriate recovery copy for each reason. */
export function micErrorCopy(reason: MicErrorReason): MicErrorCopy {
  switch (reason) {
    case 'denied':
      return {
        title: 'Microphone access blocked',
        body: 'Your browser is blocking microphone access for this page. Pitch detection won\'t work without it.',
        steps: [
          'Click the camera or lock icon in your browser\'s address bar',
          'Set Microphone to "Allow"',
          'Reload the page and tap Start again',
        ],
      };
    case 'no-device':
      return {
        title: 'No microphone found',
        body: 'The browser can\'t find a microphone. Check that one is plugged in and not disabled in your OS settings.',
        steps: [
          'Plug in a microphone or enable the built-in one',
          'On macOS: System Settings → Privacy & Security → Microphone',
          'Reload the page and tap Start again',
        ],
      };
    case 'in-use':
      return {
        title: 'Microphone is in use',
        body: 'Another app or browser tab has an exclusive lock on the microphone.',
        steps: [
          'Close other apps or tabs that may be using the microphone',
          'Tap Retry to try again',
        ],
      };
    case 'insecure':
      return {
        title: 'Secure connection required',
        body: 'Browsers only allow microphone access on HTTPS pages. Open the app via an https:// URL.',
      };
    case 'unknown':
      return {
        title: 'Couldn\'t access microphone',
        body: 'An unexpected error occurred while requesting microphone access. Try reloading the page.',
        steps: [
          'Reload the page and tap Start again',
          'If the problem persists, check your browser\'s site permissions',
        ],
      };
  }
}
