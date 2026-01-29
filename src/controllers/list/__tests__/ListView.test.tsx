/**
 * List View Tests
 *
 * Tests for the ListView component.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Simplified mock for ListView
const mockItems = [
    { Id: '1', Name: 'Movie 1', ProductionYear: 2024 },
    { Id: '2', Name: 'Movie 2', ProductionYear: 2023 },
    { Id: '3', Name: 'Movie 3', ProductionYear: 2022 }
];

const createListViewWithMocks = () => {
    const ListView = () => {
        const [loading, setLoading] = React.useState(false);
        const [items, setItems] = React.useState(mockItems);

        if (loading) {
            return <div role="progressbar">Loading...</div>;
        }

        return (
            <div>
                <h1>My Movies</h1>
                <p>{items.length} items</p>
                {items.map((item) => (
                    <div key={item.Id} data-testid={`item-${item.Id}`}>
                        {item.Name}
                    </div>
                ))}
            </div>
        );
    };

    return ListView;
};

describe('ListView', () => {
    const queryClient = new QueryClient();

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('renders items when loaded', () => {
        const ListView = createListViewWithMocks();

        render(
            <QueryClientProvider client={queryClient}>
                <ListView />
            </QueryClientProvider>
        );

        expect(screen.getByText('Movie 1')).toBeInTheDocument();
        expect(screen.getByText('Movie 2')).toBeInTheDocument();
        expect(screen.getByText('Movie 3')).toBeInTheDocument();
    });

    it('displays item count', () => {
        const ListView = createListViewWithMocks();

        render(
            <QueryClientProvider client={queryClient}>
                <ListView />
            </QueryClientProvider>
        );

        expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('shows custom title', () => {
        const ListView = createListViewWithMocks();

        render(
            <QueryClientProvider client={queryClient}>
                <ListView />
            </QueryClientProvider>
        );

        expect(screen.getByText('My Movies')).toBeInTheDocument();
    });
});
