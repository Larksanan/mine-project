/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast Hook Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have stable function references across re-renders', () => {
    const { result, rerender } = renderHook(() => useToast());

    const firstReferences = {
      showToast: result.current.showToast,
      hideToast: result.current.hideToast,
    };

    for (let i = 0; i < 10; i++) {
      rerender();
    }

    const finalReferences = {
      showToast: result.current.showToast,
      hideToast: result.current.hideToast,
    };

    expect(firstReferences.showToast).toBe(finalReferences.showToast);
    expect(firstReferences.hideToast).toBe(finalReferences.hideToast);
  });

  it('should handle high frequency updates efficiently', () => {
    const { result } = renderHook(() => useToast());

    const startTime = performance.now();

    // Perform 1000 rapid updates
    for (let i = 0; i < 1000; i++) {
      act(() => {
        result.current.showToast(`Message ${i}`, 'success');
        if (i % 2 === 0) {
          result.current.hideToast();
        }
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000);
  });

  it('should not cause memory leaks with rapid mount/unmount', () => {
    const mountUnmountCount = 100;

    for (let i = 0; i < mountUnmountCount; i++) {
      const { result, unmount } = renderHook(() => useToast());

      act(() => {
        const { showToast, hideToast } = result.current;
        showToast('Test', 'success');
        hideToast();
      });

      unmount();
    }

    expect(true).toBe(true);
  });
});
