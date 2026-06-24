import { classifyMicError, micErrorCopy, type MicErrorReason } from '../micError';

// classifyMicError reads window.isSecureContext. The unit project runs in Node
// (no window), so we inject a minimal global stub only for the insecure-context
// test case; all other tests rely on the `typeof window !== 'undefined'` guard
// in the implementation, which skips the secure-context check in Node.

describe('classifyMicError', () => {
  it('maps NotAllowedError to "denied"', () => {
    expect(classifyMicError(new DOMException('', 'NotAllowedError'))).toBe('denied');
  });

  it('maps SecurityError to "denied"', () => {
    expect(classifyMicError(new DOMException('', 'SecurityError'))).toBe('denied');
  });

  it('maps NotFoundError to "no-device"', () => {
    expect(classifyMicError(new DOMException('', 'NotFoundError'))).toBe('no-device');
  });

  it('maps OverconstrainedError to "no-device"', () => {
    expect(classifyMicError(new DOMException('', 'OverconstrainedError'))).toBe('no-device');
  });

  it('maps NotReadableError to "in-use"', () => {
    expect(classifyMicError(new DOMException('', 'NotReadableError'))).toBe('in-use');
  });

  it('maps AbortError to "in-use"', () => {
    expect(classifyMicError(new DOMException('', 'AbortError'))).toBe('in-use');
  });

  it('returns "insecure" when window.isSecureContext is false', () => {
    // Temporarily install a window stub so the guard fires.
    const prev = (globalThis as Record<string, unknown>).window;
    (globalThis as Record<string, unknown>).window = { isSecureContext: false };
    try {
      expect(classifyMicError(new DOMException('', 'NotAllowedError'))).toBe('insecure');
    } finally {
      (globalThis as Record<string, unknown>).window = prev;
    }
  });

  it('returns "unknown" for a plain Error', () => {
    expect(classifyMicError(new Error('something strange'))).toBe('unknown');
  });

  it('returns "unknown" for non-Error values', () => {
    expect(classifyMicError('oops')).toBe('unknown');
    expect(classifyMicError(null)).toBe('unknown');
  });
});

describe('micErrorCopy', () => {
  const reasons: MicErrorReason[] = ['denied', 'no-device', 'in-use', 'insecure', 'unknown'];

  it.each(reasons)('returns a non-empty title + body for "%s"', (reason) => {
    const copy = micErrorCopy(reason);
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.body.length).toBeGreaterThan(0);
  });

  it('denied copy includes address-bar step', () => {
    const { steps } = micErrorCopy('denied');
    expect(steps?.some((s) => /address bar/i.test(s))).toBe(true);
  });

  it('insecure copy has no steps (no actionable fix in-page)', () => {
    const { steps } = micErrorCopy('insecure');
    expect(steps).toBeUndefined();
  });
});
