/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useToast } from '../useToast';
import { Toast } from '@/components/Toast';

// Mock the Toast component
jest.mock('@/components/Toast', () => ({
  Toast: jest.fn(({ message, type, onClose }) => (
    <div data-testid='mock-toast'>
      <span data-testid='toast-message'>{message}</span>
      <span data-testid='toast-type'>{type}</span>
      <button data-testid='toast-close' onClick={onClose}>
        Close
      </button>
    </div>
  )),
}));

// Test component that uses useToast
const TestComponent = () => {
  const { toast, showToast, hideToast } = useToast();

  return (
    <div>
      <button
        data-testid='show-success'
        onClick={() => showToast('Success message', 'success')}
      >
        Show Success
      </button>
      <button
        data-testid='show-error'
        onClick={() => showToast('Error message', 'error')}
      >
        Show Error
      </button>
      <button
        data-testid='show-info'
        onClick={() => showToast('Info message', 'info')}
      >
        Show Info
      </button>
      <button data-testid='hide-toast' onClick={hideToast}>
        Hide Toast
      </button>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

describe('useToast Hook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show and hide toast through UI interactions', () => {
    render(<TestComponent />);

    // Initially no toast
    expect(screen.queryByTestId('mock-toast')).not.toBeInTheDocument();

    // Show success toast
    fireEvent.click(screen.getByTestId('show-success'));

    expect(screen.getByTestId('mock-toast')).toBeInTheDocument();
    expect(screen.getByTestId('toast-message')).toHaveTextContent(
      'Success message'
    );
    expect(screen.getByTestId('toast-type')).toHaveTextContent('success');

    // Verify Toast component was called with correct props
    expect(Toast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Success message',
        type: 'success',
      }),
      undefined
    );

    // Hide toast
    fireEvent.click(screen.getByTestId('hide-toast'));

    expect(screen.queryByTestId('mock-toast')).not.toBeInTheDocument();
  });

  it('should show different toast types', () => {
    render(<TestComponent />);

    // Show error toast
    fireEvent.click(screen.getByTestId('show-error'));
    expect(screen.getByTestId('toast-type')).toHaveTextContent('error');

    // Hide and show info toast
    fireEvent.click(screen.getByTestId('hide-toast'));
    fireEvent.click(screen.getByTestId('show-info'));
    expect(screen.getByTestId('toast-type')).toHaveTextContent('info');
  });

  it('should close toast via Toast component close button', () => {
    render(<TestComponent />);

    // Show toast
    fireEvent.click(screen.getByTestId('show-success'));

    // Close via Toast component's close button
    fireEvent.click(screen.getByTestId('toast-close'));

    expect(screen.queryByTestId('mock-toast')).not.toBeInTheDocument();
  });

  it('should handle multiple rapid toast operations', () => {
    render(<TestComponent />);

    const showSuccessBtn = screen.getByTestId('show-success');
    const hideToastBtn = screen.getByTestId('hide-toast');

    // Rapidly show and hide toast
    for (let i = 0; i < 5; i++) {
      fireEvent.click(showSuccessBtn);
      fireEvent.click(hideToastBtn);
    }

    // Final state should be no toast
    expect(screen.queryByTestId('mock-toast')).not.toBeInTheDocument();
  });
});
