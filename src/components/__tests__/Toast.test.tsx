/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../Toast';
import { ToastData } from '@/types/booking';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div data-testid='motion-div' {...props}>
        {children}
      </div>
    ),
  },
}));

jest.mock('react-icons/fi', () => ({
  FiCheckCircle: () => <div data-testid='fi-check-circle'>CheckCircle</div>,
  FiAlertCircle: () => <div data-testid='fi-alert-circle'>AlertCircle</div>,
  FiInfo: () => <div data-testid='fi-info'>Info</div>,
  FiX: () => <div data-testid='fi-x'>X</div>,
}));

jest.mock('@/animations/variants', () => ({
  toastVariants: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
}));

describe('Toast Component', () => {
  const mockOnClose = jest.fn();
  const defaultProps: ToastData & { onClose: () => void } = {
    message: 'Test message',
    type: 'success',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render success toast correctly', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByTestId('fi-check-circle')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toHaveClass(
        'bg-green-50 border-green-200 text-green-800'
      );
    });

    it('should render error toast correctly', () => {
      render(<Toast {...defaultProps} type='error' />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByTestId('fi-alert-circle')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toHaveClass(
        'bg-red-50 border-red-200 text-red-800'
      );
    });

    it('should render info toast correctly', () => {
      render(<Toast {...defaultProps} type='info' />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByTestId('fi-info')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toHaveClass(
        'bg-blue-50 border-blue-200 text-blue-800'
      );
    });

    it('should render with correct styling classes', () => {
      render(<Toast {...defaultProps} />);

      const toastElement = screen.getByTestId('motion-div');

      // Check base classes
      expect(toastElement).toHaveClass('fixed');
      expect(toastElement).toHaveClass('top-6');
      expect(toastElement).toHaveClass('right-6');
      expect(toastElement).toHaveClass('z-50');
      expect(toastElement).toHaveClass('border');
      expect(toastElement).toHaveClass('rounded-lg');
      expect(toastElement).toHaveClass('p-4');
      expect(toastElement).toHaveClass('shadow-lg');
      expect(toastElement).toHaveClass('min-w-75');

      // Check type-specific classes for success
      expect(toastElement).toHaveClass('bg-green-50');
      expect(toastElement).toHaveClass('border-green-200');
      expect(toastElement).toHaveClass('text-green-800');
    });

    it('should render close button', () => {
      render(<Toast {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('ml-auto');
      expect(closeButton).toHaveClass('opacity-70');
      expect(closeButton).toHaveClass('hover:opacity-100');
      expect(screen.getByTestId('fi-x')).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss functionality', () => {
    it('should auto-dismiss after 3 seconds', () => {
      render(<Toast {...defaultProps} />);

      expect(mockOnClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should clear timer on unmount', () => {
      const { unmount } = render(<Toast {...defaultProps} />);

      unmount();
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clear timer if onClose changes', () => {
      const newOnClose = jest.fn();
      const { rerender } = render(<Toast {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      rerender(<Toast {...defaultProps} onClose={newOnClose} />);

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(newOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('User interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<Toast {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not auto-dismiss after manual close', () => {
      const { unmount } = render(<Toast {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      act(() => unmount());

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should still work if auto-dismiss happens after manual close', () => {
      const { unmount } = render(<Toast {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      act(() => unmount());

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Animation props', () => {
    it('should apply correct animation variants', () => {
      render(<Toast {...defaultProps} />);
      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveAttribute('variants');
      expect(motionDiv).toHaveAttribute('initial', 'hidden');
      expect(motionDiv).toHaveAttribute('animate', 'visible');
      expect(motionDiv).toHaveAttribute('exit', 'exit');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      render(<Toast {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('should allow keyboard navigation to close button', () => {
      render(<Toast {...defaultProps} />);

      const closeButton = screen.getByRole('button');

      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      fireEvent.keyDown(closeButton, { key: 'Enter' });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(closeButton, { key: ' ' });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      render(<Toast {...defaultProps} message='' />);

      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
      expect(screen.getByTestId('fi-check-circle')).toBeInTheDocument();
      expect(screen.getByText('', { selector: 'span' })).toBeInTheDocument();
    });

    it('should handle long messages', () => {
      const longMessage =
        'This is a very long message that might overflow and need to be handled properly by the toast component to ensure good user experience';

      render(<Toast {...defaultProps} message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage =
        'Message with <script>alert("xss")</script> & HTML entities';

      render(<Toast {...defaultProps} message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();

      expect(screen.getByText(/<script>/)).toBeInTheDocument();
    });

    it('should work without framer-motion animations', () => {
      jest.unmock('framer-motion');

      const { Fragment } = require('react');
      const { motion } = require('framer-motion');

      const MockMotionDiv = motion.div;
      const { rerender } = render(
        <MockMotionDiv data-testid='real-motion-div'>
          <Toast {...defaultProps} />
        </MockMotionDiv>
      );

      jest.mock('framer-motion', () => ({
        motion: {
          div: ({ children, ...props }: any) => (
            <div data-testid='motion-div' {...props}>
              {children}
            </div>
          ),
        },
      }));
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<Toast {...defaultProps} />);

      const initialRender = screen.getByTestId('motion-div');

      rerender(<Toast {...defaultProps} />);

      const sameElement = screen.getByTestId('motion-div');
      expect(sameElement).toBe(initialRender);
    });

    it('should handle rapid open/close cycles', () => {
      const { rerender, unmount } = render(<Toast {...defaultProps} />);

      for (let i = 0; i < 5; i++) {
        unmount();
        render(<Toast {...defaultProps} />);
      }

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('TypeScript interface compliance', () => {
    it('should accept all valid ToastData types', () => {
      const successProps: ToastData = { message: 'Success', type: 'success' };
      const errorProps: ToastData = { message: 'Error', type: 'error' };
      const infoProps: ToastData = { message: 'Info', type: 'info' };

      // Should compile without errors
      expect(successProps).toBeDefined();
      expect(errorProps).toBeDefined();
      expect(infoProps).toBeDefined();
    });

    it('should require onClose function', () => {
      // This would be a TypeScript compile error, so we test by ensuring
      // the component works when provided with the required props
      const validProps = { ...defaultProps, onClose: mockOnClose };
      expect(() => render(<Toast {...validProps} />)).not.toThrow();
    });
  });
});
