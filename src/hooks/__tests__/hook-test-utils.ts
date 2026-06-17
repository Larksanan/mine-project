/**
 * @jest-environment jsdom
 */
import { useFavorites } from '../useFavorites';
import { RenderHookResult, act, renderHook } from '@testing-library/react';

export const createUseFavoritesTest = () => {
  const renderUseFavorites = () => renderHook(() => useFavorites());

  const addFavorite = (
    result: RenderHookResult<ReturnType<typeof useFavorites>, any>,
    id: string
  ) => {
    act(() => {
      result.result.current.toggleFavorite(id);
    });
  };

  const removeFavorite = (
    result: RenderHookResult<ReturnType<typeof useFavorites>, any>,
    id: string
  ) => {
    act(() => {
      result.result.current.toggleFavorite(id);
    });
  };

  const isFavorite = (
    result: RenderHookResult<ReturnType<typeof useFavorites>, any>,
    id: string
  ) => {
    return result.result.current.isFavorite(id);
  };

  const getFavoritesCount = (
    result: RenderHookResult<ReturnType<typeof useFavorites>, any>
  ) => {
    return result.result.current.favorites.size;
  };

  const getFavoritesArray = (
    result: RenderHookResult<ReturnType<typeof useFavorites>, any>
  ) => {
    return Array.from(result.result.current.favorites);
  };

  return {
    renderUseFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavoritesCount,
    getFavoritesArray,
  };
};

describe('Hook Test Utils', () => {
  it('should export helper functions', () => {
    expect(createUseFavoritesTest).toBeDefined();
  });
});
