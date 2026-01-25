/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortMenu } from '../SortMenu';
import { useSortStore } from 'store/sortStore';

vi.mock('store/sortStore');

describe('SortMenu', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useSortStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            sortBy: 'Name',
            sortOrder: 'Ascending',
            setSortBy: vi.fn(),
            setSortOrder: vi.fn(),
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('renders when open is true', () => {
        render(<SortMenu open={true} onClose={mockOnClose} />);
        expect(screen.getByText('Sort By')).toBeInTheDocument();
        expect(screen.getByText('Order')).toBeInTheDocument();
    });

    it('does not render visible content when open is false', () => {
        render(<SortMenu open={false} onClose={mockOnClose} />);
        expect(screen.queryByText('Sort By')).not.toBeInTheDocument();
    });

    it('displays all sort options', () => {
        render(<SortMenu open={true} onClose={mockOnClose} />);
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Sort Name')).toBeInTheDocument();
        expect(screen.getByText('Premiere Date')).toBeInTheDocument();
        expect(screen.getByText('Date Added')).toBeInTheDocument();
        expect(screen.getByText('Play Count')).toBeInTheDocument();
        expect(screen.getByText('Rating')).toBeInTheDocument();
        expect(screen.getByText('Runtime')).toBeInTheDocument();
    });

    it('shows Ascending and Descending order options', () => {
        render(<SortMenu open={true} onClose={mockOnClose} />);
        expect(screen.getByText('Ascending')).toBeInTheDocument();
        expect(screen.getByText('Descending')).toBeInTheDocument();
    });

    it('highlights selected sort option', () => {
        (useSortStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            sortBy: 'PremiereDate',
            sortOrder: 'Ascending',
            setSortBy: vi.fn(),
            setSortOrder: vi.fn(),
        });

        render(<SortMenu open={true} onClose={mockOnClose} />);
        const premiereDateRadio = screen.getByRole('radio', { name: 'Premiere Date' });
        expect(premiereDateRadio).toHaveAttribute('data-state', 'checked');
    });

    it('highlights selected sort order', () => {
        (useSortStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            sortBy: 'Name',
            sortOrder: 'Descending',
            setSortBy: vi.fn(),
            setSortOrder: vi.fn(),
        });

        render(<SortMenu open={true} onClose={mockOnClose} />);
        const descendingRadio = screen.getByRole('radio', { name: 'Descending' });
        expect(descendingRadio).toHaveAttribute('data-state', 'checked');
    });

    it('calls setSortBy when sort option is clicked', async () => {
        const mockSetSortBy = vi.fn();
        (useSortStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            sortBy: 'Name',
            sortOrder: 'Ascending',
            setSortBy: mockSetSortBy,
            setSortOrder: vi.fn(),
        });

        render(<SortMenu open={true} onClose={mockOnClose} />);
        await userEvent.click(screen.getByText('Premiere Date'));
        expect(mockSetSortBy).toHaveBeenCalledWith('PremiereDate');
    });

    it('calls setSortOrder when Ascending is selected', async () => {
        const mockSetSortOrder = vi.fn();
        (useSortStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            sortBy: 'Name',
            sortOrder: 'Descending',
            setSortBy: vi.fn(),
            setSortOrder: mockSetSortOrder,
        });

        render(<SortMenu open={true} onClose={mockOnClose} />);
        const ascendingRadio = screen.getByRole('radio', { name: 'Ascending' });
        await userEvent.click(ascendingRadio);
        expect(mockSetSortOrder).toHaveBeenCalledWith('Ascending');
    });

    it('calls setSortOrder when Descending is selected', async () => {
        const mockSetSortOrder = vi.fn();
        (useSortStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            sortBy: 'Name',
            sortOrder: 'Ascending',
            setSortBy: vi.fn(),
            setSortOrder: mockSetSortOrder,
        });

        render(<SortMenu open={true} onClose={mockOnClose} />);
        const descendingRadio = screen.getByRole('radio', { name: 'Descending' });
        await userEvent.click(descendingRadio);
        expect(mockSetSortOrder).toHaveBeenCalledWith('Descending');
    });

    it('has correct radio checked states', () => {
        (useSortStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            sortBy: 'Runtime',
            sortOrder: 'Ascending',
            setSortBy: vi.fn(),
            setSortOrder: vi.fn(),
        });

        render(<SortMenu open={true} onClose={mockOnClose} />);
        expect(screen.getByRole('radio', { name: 'Name' })).toHaveAttribute('data-state', 'unchecked');
        expect(screen.getByRole('radio', { name: 'Runtime' })).toHaveAttribute('data-state', 'checked');
        expect(screen.getByRole('radio', { name: 'Ascending' })).toHaveAttribute('data-state', 'checked');
        expect(screen.getByRole('radio', { name: 'Descending' })).toHaveAttribute('data-state', 'unchecked');
    });

    it('positions correctly when open', () => {
        render(<SortMenu open={true} onClose={mockOnClose} />);
        expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('hides when closed', () => {
        render(<SortMenu open={false} onClose={mockOnClose} />);
        expect(screen.queryByText('Sort By')).not.toBeInTheDocument();
    });
});
