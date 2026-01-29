import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionMenu } from '../ActionMenu';

describe('ActionMenu', () => {
    const mockOnSelect = vi.fn();
    const mockOnClose = vi.fn();

    const mockItems = [
        { id: 'play', name: 'Play', icon: 'play_arrow' },
        { id: 'add-to-queue', name: 'Add to Queue', icon: 'queue_music' },
        { divider: true },
        { id: 'favorite', name: 'Favorite', icon: 'favorite', selected: true },
        { id: 'delete', name: 'Delete', icon: 'delete' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultProps = {
        items: mockItems,
        anchorEl: document.createElement('div'),
        open: true,
        onClose: mockOnClose,
        onSelect: mockOnSelect,
        title: 'Test Menu',
        showCancel: true,
        onCancel: vi.fn()
    };

    it('renders menu when open', () => {
        render(<ActionMenu {...defaultProps} />);
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('displays title when provided', () => {
        render(<ActionMenu {...defaultProps} />);
        expect(screen.getByText('Test Menu')).toBeInTheDocument();
    });

    it('renders all menu items', () => {
        render(<ActionMenu {...defaultProps} />);
        expect(screen.getByText('Play')).toBeInTheDocument();
        expect(screen.getByText('Add to Queue')).toBeInTheDocument();
        expect(screen.getByText('Favorite')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('shows divider between items', () => {
        render(<ActionMenu {...defaultProps} />);
        expect(screen.getAllByRole('separator').length).toBeGreaterThan(0);
    });

    it('calls onSelect when item is clicked', async () => {
        render(<ActionMenu {...defaultProps} />);
        await userEvent.click(screen.getByText('Play'));
        expect(mockOnSelect).toHaveBeenCalledWith('play');
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
        render(<ActionMenu {...defaultProps} showCancel />);
        await userEvent.click(screen.getByText('Cancel'));
        expect(defaultProps.onCancel).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not render cancel button when showCancel is false', () => {
        render(<ActionMenu {...defaultProps} showCancel={false} />);
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('highlights selected items', () => {
        render(<ActionMenu {...defaultProps} />);
        const favoriteItem = screen.getByText('Favorite').closest('[role="menuitem"]');
        expect(favoriteItem).toHaveAttribute('data-selected', 'true');
    });

    it('renders icons for items', () => {
        render(<ActionMenu {...defaultProps} />);
        const playIcon = screen.getByText('Play').parentElement?.parentElement;
        expect(playIcon).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
        render(<ActionMenu {...defaultProps} open={false} />);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('handles keyboard navigation', async () => {
        render(<ActionMenu {...defaultProps} />);
        const menuItem = screen.getByText('Play').closest('[role="menuitem"]');
        (menuItem as HTMLElement)?.focus();
        await userEvent.keyboard('[Enter]');
        expect(mockOnSelect).toHaveBeenCalledWith('play');
    });

    it('handles Escape key to close', async () => {
        render(<ActionMenu {...defaultProps} />);
        await userEvent.keyboard('{Escape}');
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders items with secondary text', () => {
        const itemsWithSecondary = [
            { id: '1', name: 'Item 1', secondaryText: 'Description' },
            { id: '2', name: 'Item 2' }
        ];
        render(<ActionMenu {...defaultProps} items={itemsWithSecondary} />);
        expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders items with aside text', () => {
        const itemsWithAside = [{ id: '1', name: 'Item', asideText: '1:30' }];
        render(<ActionMenu {...defaultProps} items={itemsWithAside} />);
        expect(screen.getByText('1:30')).toBeInTheDocument();
    });

    it('handles items without icons', async () => {
        const itemsNoIcon = [{ id: 'simple', name: 'Simple Item' }];
        render(<ActionMenu {...defaultProps} items={itemsNoIcon} />);
        await userEvent.click(screen.getByText('Simple Item'));
        expect(mockOnSelect).toHaveBeenCalledWith('simple');
    });

    it('uses value as id when id is not provided', async () => {
        const itemsWithValue = [{ value: 'value-123', name: 'Item with Value' }];
        render(<ActionMenu {...defaultProps} items={itemsWithValue} />);
        await userEvent.click(screen.getByText('Item with Value'));
        expect(mockOnSelect).toHaveBeenCalledWith('value-123');
    });

    it('handles empty items array', () => {
        render(<ActionMenu {...defaultProps} items={[]} />);
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('applies custom dialog class', () => {
        render(<ActionMenu {...defaultProps} dialogClass="custom-class" />);
        const paper = document.querySelector('.custom-class');
        expect(paper).toBeInTheDocument();
    });

    it('renders text description when provided', () => {
        render(<ActionMenu {...defaultProps} text="This is a description" />);
        expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('accepts all item properties', () => {
        const fullItem = {
            id: 'full',
            name: 'Full Item',
            icon: 'star',
            secondaryText: 'Secondary',
            asideText: 'Aside',
            selected: true
        };
        expect(() => render(<ActionMenu {...defaultProps} items={[fullItem]} />)).not.toThrow();
    });
});
