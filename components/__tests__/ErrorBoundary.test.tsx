// ErrorBoundary: render a throwing child and assert the recovery card appears.
//
// React calls console.error for every boundary-caught render error in jsdom —
// we suppress it in beforeEach so test output stays clean.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import ErrorBoundary from '@/components/ErrorBoundary';

// Child that throws on first render.
function Bomb({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement {
  if (shouldThrow) throw new Error('test-boom: rendering failed');
  return <></>;
}

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  // Suppress React's "The above error occurred…" console.error noise.
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('<ErrorBoundary />', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    // Recovery card must NOT be visible.
    expect(screen.queryByText('Something hiccuped')).toBeNull();
  });

  it('shows the recovery headline when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something hiccuped')).toBeTruthy();
    expect(screen.getByText('The app hit an unexpected error. Your saved data is safe.')).toBeTruthy();
    // Error message surfaces in the code block.
    expect(screen.getByText(/test-boom/)).toBeTruthy();
  });

  it('shows the Reload button on web (Platform.OS === "web" in jest-expo/web)', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByLabelText('Reload the app')).toBeTruthy();
  });

  it('"Copy details" calls navigator.clipboard.writeText with the error text', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    const btn = screen.getByLabelText('Copy error details to clipboard');
    fireEvent.click(btn);

    await new Promise<void>((r) => setTimeout(r, 0));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('test-boom'),
    );
  });
});
