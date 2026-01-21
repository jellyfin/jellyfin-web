import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import AdvancedDrawerSection from './AdvancedDrawerSection';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

describe('AdvancedDrawerSection', () => {
    it('renders the advanced navigation links', () => {
        const future = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            v7_startTransition: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            v7_relativeSplatPath: true
        };

        render(
            <MemoryRouter future={future}>
                <AdvancedDrawerSection />
            </MemoryRouter>
        );

        expect(screen.getByText('TabAdvanced')).toBeVisible();

        const linkNames = [
            'TabNetworking',
            'HeaderApiKeys',
            'HeaderBackups',
            'TabLogs',
            'TabScheduledTasks'
        ];

        for (const name of linkNames) {
            expect(screen.getByRole('link', { name })).toBeVisible();
        }
    });
});
