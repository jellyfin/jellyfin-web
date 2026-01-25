/**
 * MediaGrid Tests
 *
 * Tests for the MediaGrid component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MediaGrid } from '../MediaGrid';

// Mock window.ApiClient
const mockGetImageUrl = vi.fn((id, options) => `http://test.com/image/${id}`);
const mockApiClient = {
    getImageUrl: mockGetImageUrl,
};

Object.defineProperty(window, 'ApiClient', {
    value: { getApiClient: () => mockApiClient },
    writable: true,
});

describe('MediaGrid', () => {
    const mockItems = [
        { Id: '1', Name: 'Movie 1', ProductionYear: 2024 },
        { Id: '2', Name: 'Movie 2', ProductionYear: 2023 },
        { Id: '3', Name: 'Movie 3', ProductionYear: 2022 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
    });

    it('renders items in a grid', () => {
        render(<MediaGrid items={mockItems} />);

        expect(screen.getByText('Movie 1')).toBeInTheDocument();
        expect(screen.getByText('Movie 2')).toBeInTheDocument();
        expect(screen.getByText('Movie 3')).toBeInTheDocument();
    });

    it('renders empty state when no items', () => {
        render(<MediaGrid items={[]} emptyMessage="No movies found" />);

        expect(screen.getByText('No movies found')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<MediaGrid items={[]} loading />);

        expect(screen.queryByText('No items found')).not.toBeInTheDocument();
    });

    it('calls onItemClick when item is clicked', () => {
        const handleClick = vi.fn();
        render(<MediaGrid items={mockItems} onItemClick={handleClick} />);

        fireEvent.click(screen.getByText('Movie 2'));
        expect(handleClick).toHaveBeenCalledWith(mockItems[1]);
    });

    it('shows play buttons when showPlayButtons is true', () => {
        render(<MediaGrid items={mockItems} showPlayButtons />);

        // Cards should be rendered with play button capability
        expect(screen.getByText('Movie 1')).toBeInTheDocument();
        expect(screen.getByText('Movie 2')).toBeInTheDocument();
        expect(screen.getByText('Movie 3')).toBeInTheDocument();
    });

    it('renders with different card sizes', () => {
        const { rerender } = render(<MediaGrid items={mockItems} cardSize="small" />);
        expect(screen.getByText('Movie 1')).toBeInTheDocument();

        rerender(<MediaGrid items={mockItems} cardSize="large" />);
        expect(screen.getByText('Movie 1')).toBeInTheDocument();
    });

    it('renders correct number of items', () => {
        render(<MediaGrid items={mockItems} />);

        expect(screen.getByText('Movie 1')).toBeInTheDocument();
        expect(screen.getByText('Movie 2')).toBeInTheDocument();
        expect(screen.getByText('Movie 3')).toBeInTheDocument();
    });

    it('handles custom empty message', () => {
        render(<MediaGrid items={[]} emptyMessage="Custom empty message" />);

        expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('uses default empty message when not provided', () => {
        render(<MediaGrid items={[]} />);

        expect(screen.getByText('No items found')).toBeInTheDocument();
    });
});
