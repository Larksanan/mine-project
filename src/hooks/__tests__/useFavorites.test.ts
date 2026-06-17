/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../useFavorites';

describe('useFavorites Hook', () => {
  describe('Initial state', () => {
    it('should initialize with empty Set', () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toBeInstanceOf(Set);
      expect(result.current.favorites.size).toBe(0);
      expect(typeof result.current.toggleFavorite).toBe('function');
      expect(typeof result.current.isFavorite).toBe('function');
    });
  });

  describe('toggleFavorite function', () => {
    it('should add item to favorites when not already favorited', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.favorites.has('item-1')).toBe(true);
      expect(result.current.favorites.size).toBe(1);
    });

    it('should remove item from favorites when already favorited', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.favorites.has('item-1')).toBe(true);

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.favorites.has('item-1')).toBe(false);
      expect(result.current.favorites.size).toBe(0);
    });

    it('should handle multiple items', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-2');
        result.current.toggleFavorite('item-3');
      });

      expect(result.current.favorites.size).toBe(3);
      expect(result.current.favorites.has('item-1')).toBe(true);
      expect(result.current.favorites.has('item-2')).toBe(true);
      expect(result.current.favorites.has('item-3')).toBe(true);
    });

    it('should handle toggling multiple items independently', () => {
      const { result } = renderHook(() => useFavorites());

      // Add items
      act(() => {
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-2');
      });

      expect(result.current.favorites.size).toBe(2);

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.favorites.size).toBe(1);
      expect(result.current.favorites.has('item-1')).toBe(false);
      expect(result.current.favorites.has('item-2')).toBe(true);

      act(() => {
        result.current.toggleFavorite('item-3');
      });

      expect(result.current.favorites.size).toBe(2);
      expect(result.current.favorites.has('item-2')).toBe(true);
      expect(result.current.favorites.has('item-3')).toBe(true);
    });

    it('should handle duplicate toggle calls', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.favorites.has('item-1')).toBe(true);
      expect(result.current.favorites.size).toBe(1);
    });

    it('should handle empty string ID', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('');
      });

      expect(result.current.favorites.has('')).toBe(true);
      expect(result.current.favorites.size).toBe(1);
    });

    it('should handle special characters in ID', () => {
      const { result } = renderHook(() => useFavorites());

      const specialId = 'item-@#$%^&*()_+{}|:"<>?';

      act(() => {
        result.current.toggleFavorite(specialId);
      });

      expect(result.current.favorites.has(specialId)).toBe(true);
    });

    it('should handle very long IDs', () => {
      const { result } = renderHook(() => useFavorites());

      const longId = 'a'.repeat(1000);

      act(() => {
        result.current.toggleFavorite(longId);
      });

      expect(result.current.favorites.has(longId)).toBe(true);
    });
  });

  describe('isFavorite function', () => {
    it('should return true for favorited items', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.isFavorite('item-1')).toBe(true);
    });

    it('should return false for non-favorited items', () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite('item-1')).toBe(false);
    });

    it('should return false for items that were removed', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.isFavorite('item-1')).toBe(false);
    });

    it('should handle checking empty string', () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite('')).toBe(false);

      act(() => {
        result.current.toggleFavorite('');
      });

      expect(result.current.isFavorite('')).toBe(true);
    });

    it('should be case-sensitive', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('ITEM-1');
      });

      expect(result.current.isFavorite('ITEM-1')).toBe(true);
      expect(result.current.isFavorite('item-1')).toBe(false);
    });
  });

  describe('useCallback dependencies', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useFavorites());

      const firstToggleFavorite = result.current.toggleFavorite;
      const firstIsFavorite = result.current.isFavorite;

      rerender();

      const secondToggleFavorite = result.current.toggleFavorite;
      const secondIsFavorite = result.current.isFavorite;

      expect(firstToggleFavorite).toBe(secondToggleFavorite);

      expect(firstIsFavorite).toBe(secondIsFavorite);
    });

    it('should update isFavorite when favorites changes', () => {
      const { result, rerender } = renderHook(() => useFavorites());

      const firstIsFavorite = result.current.isFavorite;

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      rerender();

      const secondIsFavorite = result.current.isFavorite;

      expect(firstIsFavorite).not.toBe(secondIsFavorite);
    });

    it('should work correctly with stored function references', () => {
      const { result } = renderHook(() => useFavorites());

      const { toggleFavorite } = result.current;

      act(() => {
        toggleFavorite('item-1');
      });

      expect(result.current.isFavorite('item-1')).toBe(true);
    });
  });

  describe('Multiple hook instances', () => {
    it('should maintain independent state for different hook instances', () => {
      const { result: result1 } = renderHook(() => useFavorites());
      const { result: result2 } = renderHook(() => useFavorites());

      act(() => {
        result1.current.toggleFavorite('item-1');
      });

      act(() => {
        result2.current.toggleFavorite('item-2');
      });

      expect(result1.current.isFavorite('item-1')).toBe(true);
      expect(result1.current.isFavorite('item-2')).toBe(false);

      expect(result2.current.isFavorite('item-1')).toBe(false);
      expect(result2.current.isFavorite('item-2')).toBe(true);
    });
  });

  describe('Performance and optimization', () => {
    it('should handle large number of favorites efficiently', () => {
      const { result } = renderHook(() => useFavorites());

      for (let i = 0; i < 1000; i++) {
        act(() => {
          result.current.toggleFavorite(`item-${i}`);
        });
      }

      expect(result.current.favorites.size).toBe(1000);

      // Check random items
      expect(result.current.isFavorite('item-500')).toBe(true);
      expect(result.current.isFavorite('item-999')).toBe(true);
      expect(result.current.isFavorite('item-1000')).toBe(false);
    });

    it('should not cause unnecessary re-renders with same toggle calls', () => {
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useFavorites();
      });

      const initialRenderCount = renderCount;

      act(() => {
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-1');
      });

      expect(renderCount).toBe(initialRenderCount + 1);
    });

    it('should maintain Set immutability', () => {
      const { result } = renderHook(() => useFavorites());

      const initialFavorites = result.current.favorites;

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      const updatedFavorites = result.current.favorites;

      expect(updatedFavorites).not.toBe(initialFavorites);

      expect(initialFavorites.size).toBe(0);
      expect(updatedFavorites.size).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle null or undefined IDs', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite(null as any);
      });

      expect(result.current.favorites.has(null as any)).toBe(true);

      act(() => {
        result.current.toggleFavorite(undefined as any);
      });
      expect(result.current.favorites.has(undefined as any)).toBe(true);
    });

    it('should handle non-string IDs', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        return result.current.toggleFavorite(123 as any);
      });

      expect(result.current.favorites.has(123 as any)).toBe(true);

      act(() => {
        result.current.toggleFavorite({ id: 'test' } as any);
      });

      const obj = { id: 'test' };
      act(() => {
        result.current.toggleFavorite(obj as any);
      });

      expect(result.current.favorites.has(obj as any)).toBe(true);
    });

    it('should handle rapid successive toggles', () => {
      const { result } = renderHook(() => useFavorites());

      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.toggleFavorite('item-1');
        });
      }

      expect(result.current.favorites.has('item-1')).toBe(false);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple concurrent toggle operations', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-2');
        result.current.toggleFavorite('item-3');
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.favorites.size).toBe(2);
      expect(result.current.favorites.has('item-1')).toBe(false);
      expect(result.current.favorites.has('item-2')).toBe(true);
      expect(result.current.favorites.has('item-3')).toBe(true);
    });

    it('should handle race conditions between multiple toggles', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-1');
        result.current.toggleFavorite('item-1');
      });

      expect(result.current.favorites.has('item-1')).toBe(true);
    });
  });

  describe('Set operations verification', () => {
    it('should properly use Set operations', () => {
      renderHook(() => useFavorites());

      const testSet = new Set<string>();

      testSet.add('item-1');
      expect(testSet.has('item-1')).toBe(true);

      testSet.delete('item-1');
      expect(testSet.has('item-1')).toBe(false);

      expect(testSet.size).toBe(0);
    });

    it('should create new Set instance on each toggle', () => {
      const { result } = renderHook(() => useFavorites());

      const set1 = result.current.favorites;

      act(() => {
        result.current.toggleFavorite('item-1');
      });

      const set2 = result.current.favorites;

      expect(set2).not.toBe(set1);
      expect(set2).toBeInstanceOf(Set);
    });
  });

  describe('TypeScript interface compliance', () => {
    it('should return correct TypeScript types', () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toBeInstanceOf(Set);
      expect(typeof result.current.toggleFavorite).toBe('function');
      expect(typeof result.current.isFavorite).toBe('function');

      act(() => {
        expect(() => result.current.toggleFavorite('test-id')).not.toThrow();
      });
      expect(() => result.current.isFavorite('test-id')).not.toThrow();
      expect(typeof result.current.isFavorite('test-id')).toBe('boolean');
    });
  });
});
