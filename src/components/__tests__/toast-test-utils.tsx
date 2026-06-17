/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '@/components/Toast';
import { ToastData } from '@/types/booking';

export const createToastProps = (
  overrides?: Partial<ToastData>
): ToastData & { onClose: jest.Mock } => ({
  message: 'Test message',
  type: 'success',
  onClose: jest.fn(),
  ...overrides,
});

export const renderToast = (
  props?: Partial<ToastData & { onClose: jest.Mock }>
) => {
  const defaultProps = createToastProps();
  const mergedProps = { ...defaultProps, ...props };

  return {
    ...render(<Toast {...mergedProps} />),
    props: mergedProps,
  };
};

export const advanceTimer = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

export const waitForAutoDismiss = () => {
  advanceTimer(3000);
};

export const closeToastManually = () => {
  const closeButton = screen.getByRole('button');
  fireEvent.click(closeButton);
};

export const getToastElement = () => screen.getByTestId('motion-div');

export const getToastMessage = () => screen.getByText(/Test message/i);

export const getCloseButton = () => screen.getByRole('button');

export const verifyToastType = (type: 'success' | 'error' | 'info') => {
  const expectedClass = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50',
  }[type];

  expect(getToastElement()).toHaveClass(expectedClass);
};

export const verifyIconRendered = (type: 'success' | 'error' | 'info') => {
  const iconTestId = {
    success: 'fi-check-circle',
    error: 'fi-alert-circle',
    info: 'fi-info',
  }[type];

  expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
};

describe('Toast Test Utils', () => {
  it('exports helper functions', () => {
    expect(createToastProps).toBeDefined();
    expect(renderToast).toBeDefined();
    expect(advanceTimer).toBeDefined();
    expect(waitForAutoDismiss).toBeDefined();
    expect(closeToastManually).toBeDefined();
    expect(getToastElement).toBeDefined();
    expect(getToastMessage).toBeDefined();
    expect(getCloseButton).toBeDefined();
    expect(verifyToastType).toBeDefined();
    expect(verifyIconRendered).toBeDefined();
  });
});
