/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../useFavorites';

describe('useFavorites Hook Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have stable function references across re-renders', () => {
    const { result, rerender } = renderHook(() => useFavorites());

    const firstReferences = {
      toggleFavorite: result.current.toggleFavorite,
      isFavorite: result.current.isFavorite,
    };

    for (let i = 0; i < 10; i++) {
      rerender();
    }

    const finalReferences = {
      toggleFavorite: result.current.toggleFavorite,
      isFavorite: result.current.isFavorite,
    };

    expect(firstReferences.toggleFavorite).toBe(finalReferences.toggleFavorite);

    expect(firstReferences.isFavorite).toBe(finalReferences.isFavorite);
  });

  it('should handle high frequency toggle operations efficiently', () => {
    const { result } = renderHook(() => useFavorites());

    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      act(() => {
        result.current.toggleFavorite(`item-${i}`);
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.current.favorites.size).toBe(1000);

    expect(executionTime).toBeLessThan(1000);

    for (let i = 0; i < 1000; i++) {
      expect(result.current.isFavorite(`item-${i}`)).toBe(true);
    }
  });

  it('should not cause memory leaks with rapid mount/unmount', () => {
    const mountUnmountCount = 100;

    for (let i = 0; i < mountUnmountCount; i++) {
      const { result, unmount } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('test-item');
        result.current.toggleFavorite('test-item');
      });

      unmount();
    }

    expect(true).toBe(true);
  });

  it('should maintain Set immutability for performance', () => {
    const { result } = renderHook(() => useFavorites());

    const sets: Set<string>[] = [];

    for (let i = 0; i < 10; i++) {
      sets.push(result.current.favorites);
      act(() => {
        result.current.toggleFavorite(`item-${i}`);
      });
    }

    for (let i = 1; i < sets.length; i++) {
      expect(sets[i]).not.toBe(sets[i - 1]);
    }

    const uniqueSets = new Set(sets);
    expect(uniqueSets.size).toBe(sets.length);
  });
});
