import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ButtonCTA from '@/components/ui/ButtonCTA';

describe('ButtonCTA', () => {
  it('renders its title and handles presses', () => {
    const onPress = jest.fn();
    render(<ButtonCTA title="Login" onPress={onPress} />);

    fireEvent.press(screen.getByText('Login'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses when disabled', () => {
    const onPress = jest.fn();
    render(<ButtonCTA title="Login" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Login'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
