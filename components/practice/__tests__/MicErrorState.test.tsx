import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { MicErrorState } from '@/components/practice/MicErrorState';

describe('<MicErrorState />', () => {
  it('renders denied-state title, body, and all three recovery steps', () => {
    render(<MicErrorState reason="denied" onRetry={jest.fn()} />);

    expect(screen.getByText('Microphone access blocked')).toBeTruthy();
    // Body copy
    expect(screen.getByText(/browser is blocking/i)).toBeTruthy();
    // Steps
    expect(screen.getByText(/address bar/i)).toBeTruthy();
    expect(screen.getByText(/Allow/)).toBeTruthy();
    expect(screen.getByText(/Reload the page/i)).toBeTruthy();
  });

  it('calls onRetry when the Retry button is pressed', () => {
    const onRetry = jest.fn();
    render(<MicErrorState reason="denied" onRetry={onRetry} />);

    const btn = screen.getByLabelText('Retry microphone access');
    act(() => {
      fireEvent.click(btn);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders no steps for the insecure reason', () => {
    render(<MicErrorState reason="insecure" onRetry={jest.fn()} />);

    expect(screen.getByText('Secure connection required')).toBeTruthy();
    // No numbered steps rendered
    expect(screen.queryByText('1.')).toBeNull();
  });

  it('renders the no-device title', () => {
    render(<MicErrorState reason="no-device" onRetry={jest.fn()} />);
    expect(screen.getByText('No microphone found')).toBeTruthy();
  });
});
