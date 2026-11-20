import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import globalize from 'lib/globalize';

import ServerUpdateNeededAlert from './ServerUpdateNeededAlert';

vi.mock('lib/globalize', () => ({
    default: {
        translate: vi.fn((key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' '))
    }
}));

const theme = createTheme({ cssVariables: true });

const renderAlert = (ui: ReactElement) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ServerUpdateNeededAlert', () => {
    it('links to the download page in a new window', () => {
        renderAlert(<ServerUpdateNeededAlert />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', 'https://jellyfin.org/downloads/server/');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link.getAttribute('rel')).toContain('noopener');
        expect(link).toHaveTextContent('jellyfin.org/downloads/server');
        // Separated from the link text, so it is not read as part of the address
        expect(link).toHaveTextContent('jellyfin.org/downloads/server translated:OpensInNewWindow');
    });

    it('puts the link where the translation has it', () => {
        vi.mocked(globalize.translate).mockImplementationOnce((_key, placeholder) => `Update at ${placeholder}, please`);

        renderAlert(<ServerUpdateNeededAlert />);

        expect(screen.getByRole('alert')).toHaveTextContent(/Update at jellyfin\.org\/downloads\/server.*, please$/);
        expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('still shows the link when the translation has no place for it', () => {
        vi.mocked(globalize.translate).mockImplementationOnce(() => 'The server needs an update');

        renderAlert(<ServerUpdateNeededAlert />);

        expect(screen.getByRole('alert')).toHaveTextContent('The server needs an update jellyfin.org/downloads/server');
        expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('does not turn the translation into markup', () => {
        vi.mocked(globalize.translate).mockImplementationOnce(() => '<a href="https://evil.example">Click</a>');

        const { container } = renderAlert(<ServerUpdateNeededAlert />);

        expect(container.querySelectorAll('a')).toHaveLength(1);
        expect(container.querySelector('a')).toHaveAttribute('href', 'https://jellyfin.org/downloads/server/');
    });

    it('can be closed', () => {
        const onClose = vi.fn();
        renderAlert(<ServerUpdateNeededAlert onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'translated:ButtonClose' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('has no close button without a handler', () => {
        renderAlert(<ServerUpdateNeededAlert />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
