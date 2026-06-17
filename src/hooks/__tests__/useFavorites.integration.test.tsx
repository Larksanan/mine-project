/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFavorites } from '../useFavorites';

const TestComponent = () => {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const items = ['item-1', 'item-2', 'item-3'];

  return (
    <div>
      <div data-testid='favorites-count'>Favorites: {favorites.size}</div>
      <div data-testid='favorites-list'>{Array.from(favorites).join(', ')}</div>

      {items.map(item => (
        <div key={item} data-testid={`item-${item}`}>
          <span data-testid={`item-name-${item}`}>{item}</span>
          <button
            data-testid={`toggle-${item}`}
            onClick={() => toggleFavorite(item)}
          >
            {isFavorite(item) ? 'Remove Favorite' : 'Add Favorite'}
          </button>
          <span data-testid={`status-${item}`}>
            {isFavorite(item) ? '★' : '☆'}
          </span>
        </div>
      ))}
    </div>
  );
};

describe('useFavorites Hook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with initial state', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('favorites-count')).toHaveTextContent(
      'Favorites: 0'
    );
    expect(screen.getByTestId('favorites-list')).toHaveTextContent('');

    expect(screen.getByTestId('toggle-item-1')).toHaveTextContent(
      'Add Favorite'
    );
    expect(screen.getByTestId('toggle-item-2')).toHaveTextContent(
      'Add Favorite'
    );
    expect(screen.getByTestId('toggle-item-3')).toHaveTextContent(
      'Add Favorite'
    );

    expect(screen.getByTestId('status-item-1')).toHaveTextContent('☆');
    expect(screen.getByTestId('status-item-2')).toHaveTextContent('☆');
    expect(screen.getByTestId('status-item-3')).toHaveTextContent('☆');
  });

  it('should add item to favorites when button is clicked', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('toggle-item-1'));

    expect(screen.getByTestId('favorites-count')).toHaveTextContent(
      'Favorites: 1'
    );
    expect(screen.getByTestId('favorites-list')).toHaveTextContent('item-1');
    expect(screen.getByTestId('toggle-item-1')).toHaveTextContent(
      'Remove Favorite'
    );
    expect(screen.getByTestId('status-item-1')).toHaveTextContent('★');
  });

  it('should remove item from favorites when button is clicked again', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('toggle-item-1'));
    fireEvent.click(screen.getByTestId('toggle-item-1'));

    expect(screen.getByTestId('favorites-count')).toHaveTextContent(
      'Favorites: 0'
    );
    expect(screen.getByTestId('favorites-list')).toHaveTextContent('');
    expect(screen.getByTestId('toggle-item-1')).toHaveTextContent(
      'Add Favorite'
    );
    expect(screen.getByTestId('status-item-1')).toHaveTextContent('☆');
  });

  it('should handle multiple items independently', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('toggle-item-1'));
    fireEvent.click(screen.getByTestId('toggle-item-3'));

    expect(screen.getByTestId('favorites-count')).toHaveTextContent(
      'Favorites: 2'
    );
    expect(screen.getByTestId('favorites-list')).toHaveTextContent(
      'item-1, item-3'
    );

    expect(screen.getByTestId('toggle-item-1')).toHaveTextContent(
      'Remove Favorite'
    );
    expect(screen.getByTestId('toggle-item-2')).toHaveTextContent(
      'Add Favorite'
    );
    expect(screen.getByTestId('toggle-item-3')).toHaveTextContent(
      'Remove Favorite'
    );

    expect(screen.getByTestId('status-item-1')).toHaveTextContent('★');
    expect(screen.getByTestId('status-item-2')).toHaveTextContent('☆');
    expect(screen.getByTestId('status-item-3')).toHaveTextContent('★');
  });

  it('should update UI when favorites change', () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('toggle-item-1'));

    expect(screen.getByTestId('favorites-count')).toHaveTextContent(
      'Favorites: 1'
    );
    expect(screen.getByTestId('toggle-item-1')).toHaveTextContent(
      'Remove Favorite'
    );
    fireEvent.click(screen.getByTestId('toggle-item-2'));

    expect(screen.getByTestId('favorites-count')).toHaveTextContent(
      'Favorites: 2'
    );
    expect(screen.getByTestId('toggle-item-2')).toHaveTextContent(
      'Remove Favorite'
    );
    fireEvent.click(screen.getByTestId('toggle-item-1'));

    expect(screen.getByTestId('favorites-count')).toHaveTextContent(
      'Favorites: 1'
    );
    expect(screen.getByTestId('toggle-item-1')).toHaveTextContent(
      'Add Favorite'
    );
    expect(screen.getByTestId('toggle-item-2')).toHaveTextContent(
      'Remove Favorite'
    );
  });
});
