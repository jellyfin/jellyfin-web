import { screen } from '@testing-library/react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from './renderWithRouter';

const RouterConsumer = ({ label = 'Current location' }: { label?: string }) => {
    const { pathname, search, hash } = useLocation();

    return (
        <>
            <output aria-label={label}>{pathname}{search}{hash}</output>
            <Link to='/next'>Next page</Link>
        </>
    );
};

describe('renderWithRouter', () => {
    it('defaults to the root location', () => {
        renderWithRouter(<RouterConsumer />);

        expect(screen.getByRole('status', { name: 'Current location' })).toHaveTextContent(/^\/$/);
    });

    it('uses the requested initial entry and index', () => {
        renderWithRouter(<RouterConsumer />, {
            initialEntries: [ '/first?filter=all#details', '/second' ],
            initialIndex: 0
        });

        expect(screen.getByRole('status', { name: 'Current location' }))
            .toHaveTextContent('/first?filter=all#details');
    });

    it('preserves the navigated location when rerendering new UI', async () => {
        const { user, rerender } = renderWithRouter(<RouterConsumer />, {
            initialEntries: [ '/start' ]
        });

        await user.click(screen.getByRole('link', { name: 'Next page' }));
        expect(screen.getByRole('status', { name: 'Current location' })).toHaveTextContent(/^\/next$/);

        rerender(<RouterConsumer label='Updated location' />);

        expect(screen.getByRole('status', { name: 'Updated location' })).toHaveTextContent(/^\/next$/);
    });

    it('starts a fresh router and user session for a subsequent render', async () => {
        const first = renderWithRouter(<RouterConsumer />);
        await first.user.click(screen.getByRole('link', { name: 'Next page' }));
        expect(screen.getByRole('status', { name: 'Current location' })).toHaveTextContent(/^\/next$/);
        first.unmount();

        const second = renderWithRouter(<RouterConsumer />);

        expect(screen.getByRole('status', { name: 'Current location' })).toHaveTextContent(/^\/$/);
        expect(second.user).not.toBe(first.user);
    });

    it('forwards standard render options', () => {
        const container = document.createElement('main');
        const result = renderWithRouter(<RouterConsumer />, { container });

        expect(result.container).toBe(container);
        expect(result.getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '/next');
    });
});
