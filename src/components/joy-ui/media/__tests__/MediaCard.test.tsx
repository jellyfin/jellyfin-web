/**
 * MediaCard Tests
 *
 * Tests for the MediaCard component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MediaCard } from '../MediaCard';

// Mock window.ApiClient
const mockGetImageUrl = vi.fn((id, options) => `http://test.com/image/${id}`);
const mockApiClient = {
    getImageUrl: mockGetImageUrl,
};

Object.defineProperty(window, 'ApiClient', {
    value: { getApiClient: () => mockApiClient },
    writable: true,
});

describe('MediaCard', () => {
    const mockItem = {
        Id: 'test-id-123',
        Name: 'Test Movie',
        ProductionYear: 2024,
        RunTimeTicks: 7200000000000,
        OfficialRating: 'PG-13',
        ImageTags: { Primary: 'abc123' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with basic item information', () => {
        render(<MediaCard item={mockItem} />);

        expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    it('displays production year and runtime', () => {
        render(<MediaCard item={mockItem} />);

        // The subtitle contains year and runtime
        expect(screen.getByText(/2024/)).toBeInTheDocument();
        expect(screen.getByText(/120/)).toBeInTheDocument();
    });

    it('displays official rating', () => {
        render(<MediaCard item={mockItem} />);

        expect(screen.getByText(/PG-13/)).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<MediaCard item={mockItem} onClick={handleClick} />);

        // Click on the card content area
        const card = screen.getByText('Test Movie').closest('[class*="MuiCard-root"]');
        fireEvent.click(card!);
        expect(handleClick).toHaveBeenCalledWith(mockItem);
    });

    it('shows play button when showPlayButton is true', () => {
        render(<MediaCard item={mockItem} showPlayButton />);

        // The play button overlay should be present (hidden by default until hover)
        const card = screen.getByText('Test Movie').closest('.MuiCard-root');
        expect(card).toBeInTheDocument();
    });

    it('shows more button when onMoreClick is provided', () => {
        const handleMore = vi.fn();
        render(<MediaCard item={mockItem} onMoreClick={handleMore} />);

        // The more button is an IconButton
        const moreButton = screen.getByTestId('MoreVertIcon');
        expect(moreButton).toBeInTheDocument();
    });

    it('renders with different card sizes', () => {
        const { rerender } = render(<MediaCard item={mockItem} cardSize="small" />);
        expect(screen.getByText('Test Movie')).toBeInTheDocument();

        rerender(<MediaCard item={mockItem} cardSize="medium" />);
        expect(screen.getByText('Test Movie')).toBeInTheDocument();

        rerender(<MediaCard item={mockItem} cardSize="large" />);
        expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    it('handles item without image', () => {
        const itemWithoutImage = { ...mockItem, ImageTags: undefined };
        render(<MediaCard item={itemWithoutImage} />);

        expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('handles item with fallback to backdrop', () => {
        const itemWithBackdrop = {
            ...mockItem,
            ImageTags: undefined,
            BackdropImageTags: ['backdrop123'],
        };
        render(<MediaCard item={itemWithBackdrop} />);

        expect(screen.queryByText('No Image')).not.toBeInTheDocument();
    });

    it('handles missing optional fields gracefully', () => {
        const minimalItem = { Id: 'id-1', Name: 'Minimal Item' };
        render(<MediaCard item={minimalItem} />);

        expect(screen.getByText('Minimal Item')).toBeInTheDocument();
    });

    it('applies hover effect when onClick is provided', () => {
        render(<MediaCard item={mockItem} onClick={() => {}} />);

        const card = screen.getByText('Test Movie').closest('.MuiCard-root');
        expect(card).toHaveStyle({ cursor: 'pointer' });
    });

    it('does not apply hover effect when onClick is not provided', () => {
        render(<MediaCard item={mockItem} />);

        const card = screen.getByText('Test Movie').closest('.MuiCard-root');
        expect(card).toHaveStyle({ cursor: 'default' });
    });
});
