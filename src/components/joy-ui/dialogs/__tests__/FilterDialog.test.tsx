/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterDialog } from '../FilterDialog';
import { useFilterStore } from 'store/filterStore';

vi.mock('store/filterStore');

describe('FilterDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnApply = vi.fn();

    const defaultProps = {
        open: true,
        onClose: mockOnClose,
        onApply: mockOnApply,
        availableGenres: ['Rock', 'Jazz', 'Pop'],
        availableYears: [2020, 2021, 2022],
        availableStudios: ['Studio A', 'Studio B'],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useFilterStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            genres: [],
            years: [],
            studios: [],
            genresMode: 'and',
            setGenres: vi.fn(),
            setYears: vi.fn(),
            setStudios: vi.fn(),
            setGenresMode: vi.fn(),
            clearFilters: vi.fn(),
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('renders when open is true', () => {
        render(<FilterDialog {...defaultProps} />);
        expect(screen.getByText('Genre Match')).toBeInTheDocument();
        expect(screen.getByText('Genres')).toBeInTheDocument();
        expect(screen.getByText('Years')).toBeInTheDocument();
        expect(screen.getByText('Studios')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
        render(<FilterDialog {...defaultProps} open={false} />);
        expect(screen.queryByText('Genre Match')).not.toBeInTheDocument();
    });

    it('shows available genres', () => {
        render(<FilterDialog {...defaultProps} />);
        expect(screen.getByText('Rock')).toBeInTheDocument();
        expect(screen.getByText('Jazz')).toBeInTheDocument();
        expect(screen.getByText('Pop')).toBeInTheDocument();
    });

    it('shows available years', () => {
        render(<FilterDialog {...defaultProps} />);
        expect(screen.getByText('2020')).toBeInTheDocument();
        expect(screen.getByText('2021')).toBeInTheDocument();
        expect(screen.getByText('2022')).toBeInTheDocument();
    });

    it('shows available studios', () => {
        render(<FilterDialog {...defaultProps} />);
        expect(screen.getByText('Studio A')).toBeInTheDocument();
        expect(screen.getByText('Studio B')).toBeInTheDocument();
    });

    it('shows AND/OR radio buttons for genre match', () => {
        render(<FilterDialog {...defaultProps} />);
        expect(screen.getByLabelText('All (AND)')).toBeInTheDocument();
        expect(screen.getByLabelText('Any (OR)')).toBeInTheDocument();
        expect(screen.getByLabelText('All (AND)')).toBeChecked();
    });

    it('toggles genre selection on click', async () => {
        const user = userEvent.setup();
        render(<FilterDialog {...defaultProps} />);
        const rockChip = screen.getByText('Rock');
        await user.click(rockChip);
        expect(rockChip).toHaveStyle({ borderColor: 'var(--joy-palette-primary-500)' });
    });

    it('toggles year selection on click', async () => {
        const user = userEvent.setup();
        render(<FilterDialog {...defaultProps} />);
        const year2021 = screen.getByText('2021');
        await user.click(year2021);
        expect(year2021).toHaveStyle({ borderColor: 'var(--joy-palette-primary-500)' });
    });

    it('toggles studio selection on click', async () => {
        const user = userEvent.setup();
        render(<FilterDialog {...defaultProps} />);
        const studioB = screen.getByText('Studio B');
        await user.click(studioB);
        expect(studioB).toHaveStyle({ borderColor: 'var(--joy-palette-primary-500)' });
    });

    it('calls onClose when Cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<FilterDialog {...defaultProps} />);
        await user.click(screen.getByText('Cancel'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onApply when Apply button is clicked', async () => {
        const mockSetGenres = vi.fn();
        const mockSetYears = vi.fn();
        const mockSetStudios = vi.fn();
        const mockSetGenresMode = vi.fn();

        (useFilterStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            genres: [],
            years: [],
            studios: [],
            genresMode: 'and',
            setGenres: mockSetGenres,
            setYears: mockSetYears,
            setStudios: mockSetStudios,
            setGenresMode: mockSetGenresMode,
            clearFilters: vi.fn(),
        });

        render(<FilterDialog {...defaultProps} />);
        await userEvent.click(screen.getByText('Apply'));
        expect(mockSetGenres).toHaveBeenCalledWith([]);
        expect(mockSetYears).toHaveBeenCalledWith([]);
        expect(mockSetStudios).toHaveBeenCalledWith([]);
        expect(mockSetGenresMode).toHaveBeenCalledWith('and');
        expect(mockOnApply).toHaveBeenCalledTimes(1);
    });

    it('calls clearFilters when Clear All button is clicked', async () => {
        const mockClearFilters = vi.fn();

        (useFilterStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            genres: ['Rock'],
            years: [2020],
            studios: ['Studio A'],
            genresMode: 'or',
            setGenres: vi.fn(),
            setYears: vi.fn(),
            setStudios: vi.fn(),
            setGenresMode: vi.fn(),
            clearFilters: mockClearFilters,
        });

        render(<FilterDialog {...defaultProps} />);
        await userEvent.click(screen.getByText('Clear All'));
        expect(mockClearFilters).toHaveBeenCalledTimes(1);
    });

    it('handles empty available props gracefully', () => {
        render(
            <FilterDialog
                {...defaultProps}
                availableGenres={[]}
                availableYears={[]}
                availableStudios={[]}
            />
        );
        expect(screen.queryByText('Genres')).not.toBeInTheDocument();
        expect(screen.queryByText('Years')).not.toBeInTheDocument();
        expect(screen.queryByText('Studios')).not.toBeInTheDocument();
    });

    it('limits displayed genres to 10', () => {
        const manyGenres = Array.from({ length: 15 }, (_, i) => `Genre ${i}`);
        render(<FilterDialog {...defaultProps} availableGenres={manyGenres} />);
        expect(screen.getByText('Genre 0')).toBeInTheDocument();
        expect(screen.getByText('Genre 9')).toBeInTheDocument();
        expect(screen.queryByText('Genre 10')).not.toBeInTheDocument();
    });

    it('limits displayed years to 10', () => {
        const manyYears = Array.from({ length: 15 }, (_, i) => 2000 + i);
        render(<FilterDialog {...defaultProps} availableYears={manyYears} />);
        expect(screen.getByText('2000')).toBeInTheDocument();
        expect(screen.getByText('2009')).toBeInTheDocument();
        expect(screen.queryByText('2010')).not.toBeInTheDocument();
    });

    it('limits displayed studios to 10', () => {
        const manyStudios = Array.from({ length: 15 }, (_, i) => `Studio ${i}`);
        render(<FilterDialog {...defaultProps} availableStudios={manyStudios} />);
        expect(screen.getByText('Studio 0')).toBeInTheDocument();
        expect(screen.getByText('Studio 9')).toBeInTheDocument();
        expect(screen.queryByText('Studio 10')).not.toBeInTheDocument();
    });
});
