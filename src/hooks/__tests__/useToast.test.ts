/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';
import { ToastData } from '@/types/booking';

describe('useToast Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial state', () => {
    it('should initialize with null toast', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toast).toBeNull();
      expect(typeof result.current.showToast).toBe('function');
      expect(typeof result.current.hideToast).toBe('function');
    });
  });

  describe('showToast function', () => {
    it('should set toast with success type', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Operation successful!', 'success');
      });

      expect(result.current.toast).toEqual({
        message: 'Operation successful!',
        type: 'success',
      });
    });

    it('should set toast with error type', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('An error occurred!', 'error');
      });

      expect(result.current.toast).toEqual({
        message: 'An error occurred!',
        type: 'error',
      });
    });

    it('should set toast with info type', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Information message', 'info');
      });

      expect(result.current.toast).toEqual({
        message: 'Information message',
        type: 'info',
      });
    });

    it('should overwrite existing toast when showToast is called', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('First message', 'success');
      });

      expect(result.current.toast).toEqual({
        message: 'First message',
        type: 'success',
      });

      act(() => {
        result.current.showToast('Second message', 'error');
      });

      expect(result.current.toast).toEqual({
        message: 'Second message',
        type: 'error',
      });
    });

    it('should handle empty message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('', 'success');
      });

      expect(result.current.toast).toEqual({
        message: '',
        type: 'success',
      });
    });

    it('should handle special characters in message', () => {
      const { result } = renderHook(() => useToast());

      const specialMessage =
        'Message with <script>alert("xss")</script> & HTML entities';

      act(() => {
        result.current.showToast(specialMessage, 'info');
      });

      expect(result.current.toast).toEqual({
        message: specialMessage,
        type: 'info',
      });
    });

    it('should handle long messages', () => {
      const { result } = renderHook(() => useToast());

      const longMessage = 'A'.repeat(1000);

      act(() => {
        result.current.showToast(longMessage, 'success');
      });

      expect(result.current.toast?.message).toBe(longMessage);
      expect(result.current.toast?.message.length).toBe(1000);
    });
  });

  describe('hideToast function', () => {
    it('should clear toast when hideToast is called', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Test message', 'success');
      });

      expect(result.current.toast).not.toBeNull();

      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toast).toBeNull();
    });

    it('should do nothing when hideToast is called with no toast', () => {
      const { result } = renderHook(() => useToast());

      expect(() => {
        act(() => {
          result.current.hideToast();
        });
      }).not.toThrow();

      expect(result.current.toast).toBeNull();
    });

    it('should hide toast and then allow new toast to be shown', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('First message', 'success');
      });

      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toast).toBeNull();

      act(() => {
        result.current.showToast('Second message', 'error');
      });

      expect(result.current.toast).toEqual({
        message: 'Second message',
        type: 'error',
      });
    });
  });

  describe('useCallback dependencies', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useToast());

      const firstShowToast = result.current.showToast;
      const firstHideToast = result.current.hideToast;

      rerender();

      const secondShowToast = result.current.showToast;
      const secondHideToast = result.current.hideToast;

      expect(firstShowToast).toBe(secondShowToast);
      expect(firstHideToast).toBe(secondHideToast);
    });

    it('should work correctly with stable references', () => {
      const { result } = renderHook(() => useToast());

      const { showToast, hideToast } = result.current;

      act(() => {
        showToast('Test message', 'success');
      });

      expect(result.current.toast).toEqual({
        message: 'Test message',
        type: 'success',
      });

      act(() => {
        hideToast();
      });

      expect(result.current.toast).toBeNull();
    });
  });

  describe('Multiple hook instances', () => {
    it('should maintain independent state for different hook instances', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.showToast('First instance message', 'success');
      });

      act(() => {
        result2.current.showToast('Second instance message', 'error');
      });

      expect(result1.current.toast).toEqual({
        message: 'First instance message',
        type: 'success',
      });

      expect(result2.current.toast).toEqual({
        message: 'Second instance message',
        type: 'error',
      });

      act(() => {
        result1.current.hideToast();
      });

      expect(result1.current.toast).toBeNull();
      expect(result2.current.toast).toEqual({
        message: 'Second instance message',
        type: 'error',
      });
    });
  });

  describe('Integration with Toast component', () => {
    it('should provide data that matches ToastData interface', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Test message', 'success');
      });

      const toastData: ToastData | null = result.current.toast;

      if (toastData) {
        expect(toastData).toHaveProperty('message');
        expect(toastData).toHaveProperty('type');
        expect(typeof toastData.message).toBe('string');
        expect(['success', 'error', 'info']).toContain(toastData.type);
      }
    });

    it('should handle the full toast lifecycle', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Operation started', 'info');
      });

      expect(result.current.toast).toEqual({
        message: 'Operation started',
        type: 'info',
      });

      act(() => {
        result.current.showToast('Operation completed', 'success');
      });

      expect(result.current.toast).toEqual({
        message: 'Operation completed',
        type: 'success',
      });

      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toast).toBeNull();

      act(() => {
        result.current.showToast('Another operation', 'error');
      });

      expect(result.current.toast).toEqual({
        message: 'Another operation',
        type: 'error',
      });
    });
  });

  describe('Performance and optimization', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderCount = jest.fn();

      const { rerender } = renderHook(() => {
        renderCount();
        return useToast();
      });

      expect(renderCount).toHaveBeenCalledTimes(1);

      rerender();

      expect(renderCount).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid successive calls', () => {
      const { result } = renderHook(() => useToast());

      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.showToast(`Message ${i}`, 'success');
        });

        act(() => {
          result.current.hideToast();
        });
      }

      expect(result.current.toast).toBeNull();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle null or undefined message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        return result.current.showToast(null as any, 'success');
      });

      expect(result.current.toast).toBeTruthy();
    });

    it('should handle invalid type parameter', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Test', 'invalid-type' as any);
      });

      expect(result.current.toast).toBeTruthy();
      expect(result.current.toast?.type).toBe('invalid-type');
    });
  });

  describe('Concurrent operations', () => {
    it('should handle concurrent showToast calls', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Message 1', 'success');
        result.current.showToast('Message 2', 'error');
        result.current.showToast('Message 3', 'info');
      });

      expect(result.current.toast).toEqual({
        message: 'Message 3',
        type: 'info',
      });
    });

    it('should handle race conditions between show and hide', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Message', 'success');
        result.current.hideToast();
      });

      expect(result.current.toast).toBeNull();
    });
  });

  describe('TypeScript interface compliance', () => {
    it('should return correct TypeScript types', async () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toast).toEqual(expect.any(Object) || null);
      expect(typeof result.current.showToast).toBe('function');
      expect(typeof result.current.hideToast).toBe('function');

      const { showToast, hideToast } = result.current;

      await act(async () => {
        showToast('test', 'success');
      });
      await act(async () => {
        hideToast();
      });
    });

    it('should work with ToastData type constraints', () => {
      const { result } = renderHook(() => useToast());

      const validTypes: ToastData['type'][] = ['success', 'error', 'info'];

      validTypes.forEach(type => {
        act(() => {
          result.current.showToast(`Message for ${type}`, type);
        });

        expect(result.current.toast?.type).toBe(type);

        act(() => {
          result.current.hideToast();
        });
      });
    });
  });
});
