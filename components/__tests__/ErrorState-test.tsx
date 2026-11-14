import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ErrorState from '@/components/ui/ErrorState';
import { ApiError } from '@/scripts/services/apiClient';

describe('ErrorState', () => {
  it('shows an offline message when the server is unreachable', () => {
    render(<ErrorState error={new ApiError('network')} />);

    expect(screen.getByText("You're offline")).toBeOnTheScreen();
    expect(screen.getByText(/can't reach the one percent server/i)).toBeOnTheScreen();
  });

  it('shows a generic title for server errors', () => {
    render(<ErrorState error={new ApiError('server')} />);

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
  });

  it('turns any thrown value into a safe message', () => {
    render(<ErrorState error={new Error('TypeError: x is undefined')} />);

    expect(screen.queryByText(/TypeError/)).toBeNull();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeOnTheScreen();
  });

  it('calls onRetry when "Try again" is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorState error={new ApiError('timeout')} onRetry={onRetry} />);

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has no retry button without onRetry', () => {
    render(<ErrorState error={new ApiError('server')} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('disables retry while a retry is in flight', () => {
    const onRetry = jest.fn();
    render(<ErrorState error={new ApiError('network')} onRetry={onRetry} retrying />);

    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toBeDisabled();
    fireEvent.press(button);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('compact mode drops the title but keeps the message', () => {
    render(<ErrorState compact error={new ApiError('network')} />);

    expect(screen.queryByText("You're offline")).toBeNull();
    expect(screen.getByText(/can't reach/i)).toBeOnTheScreen();
  });

  it('is announced as an alert to screen readers', () => {
    render(<ErrorState error={new ApiError('network')} />);

    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });
});
