import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import ConnectionProblemAlert from './ConnectionProblemAlert';

vi.mock('lib/globalize', () => ({
    default: {
        translate: vi.fn((key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' '))
    }
}));

const theme = createTheme({ cssVariables: true });

const renderAlert = (ui: ReactElement) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ConnectionProblemAlert', () => {
    it('shows the update that is needed', () => {
        renderAlert(<ConnectionProblemAlert problem={{ kind: 'updateNeeded' }} />);

        expect(screen.getByRole('alert')).toHaveTextContent('translated:HeaderUpdateRequired');
        expect(screen.getByRole('link')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'translated:Retry' })).not.toBeInTheDocument();
    });

    it('does not offer a retry for the update that is needed', () => {
        renderAlert(<ConnectionProblemAlert problem={{ kind: 'updateNeeded' }} onRetry={vi.fn()} />);

        expect(screen.queryByRole('button', { name: 'translated:Retry' })).not.toBeInTheDocument();
    });

    it('shows the failure to connect', () => {
        renderAlert(<ConnectionProblemAlert problem={{ kind: 'unavailable' }} />);

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('translated:HeaderConnectionFailure');
        expect(alert).toHaveTextContent('translated:MessageServerConnectionFailed');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('can be closed', () => {
        const onClose = vi.fn();
        renderAlert(<ConnectionProblemAlert problem={{ kind: 'unavailable' }} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'translated:ButtonClose' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('retries', () => {
        const onRetry = vi.fn();
        renderAlert(<ConnectionProblemAlert problem={{ kind: 'unavailable' }} onRetry={onRetry} />);

        fireEvent.click(screen.getByRole('button', { name: 'translated:Retry' }));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('keeps the close button next to the retry button', () => {
        const onClose = vi.fn();
        renderAlert(<ConnectionProblemAlert problem={{ kind: 'unavailable' }} onRetry={vi.fn()} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'translated:ButtonClose' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
