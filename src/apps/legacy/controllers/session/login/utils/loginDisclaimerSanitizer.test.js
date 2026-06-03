/* eslint-disable sonarjs/code-eval -- test fixtures intentionally use script-executing URIs */
import { describe, expect, it } from 'vitest';

import { sanitizeLoginDisclaimer } from './loginDisclaimerSanitizer';

function hrefIn(html, scheme) {
    // Matches href values that start with the given scheme followed by `:`
    // (e.g. `matrix:`, `tg:`) so we are checking that DOMPurify kept the
    // attribute, not just that the scheme appears anywhere in the output.
    return new RegExp(`href="${scheme}:[^"]*"`).test(html);
}

describe('sanitizeLoginDisclaimer', () => {
    it('preserves the standard web schemes DOMPurify allows by default', () => {
        const html = sanitizeLoginDisclaimer([
            '<a href="https://example.com">x</a>',
            '<a href="http://example.com">x</a>',
            '<a href="mailto:admin@example.com">x</a>',
            '<a href="tel:+15551234567">x</a>'
        ].join('\n'));

        expect(hrefIn(html, 'https')).toBe(true);
        expect(hrefIn(html, 'http')).toBe(true);
        expect(hrefIn(html, 'mailto')).toBe(true);
        expect(hrefIn(html, 'tel')).toBe(true);
    });

    it('preserves the additional link-protocol schemes from issue #7958', () => {
        const html = sanitizeLoginDisclaimer([
            '<a href="matrix:r/jellyfin:matrix.org">x</a>',
            '<a href="tg://resolve?domain=jellyfin">x</a>',
            '<a href="whatsapp://send?phone=15551234567">x</a>',
            '<a href="signal://signal.me/#p/+15551234567">x</a>',
            '<a href="irc://irc.libera.chat/jellyfin">x</a>',
            '<a href="ircs://irc.libera.chat/jellyfin">x</a>'
        ].join('\n'));

        expect(hrefIn(html, 'matrix')).toBe(true);
        expect(hrefIn(html, 'tg')).toBe(true);
        expect(hrefIn(html, 'whatsapp')).toBe(true);
        expect(hrefIn(html, 'signal')).toBe(true);
        expect(hrefIn(html, 'irc')).toBe(true);
        expect(hrefIn(html, 'ircs')).toBe(true);
    });

    it('preserves relative and fragment URIs', () => {
        // Guards against the `[^a-z+.-:]` range-vs-literal trap: an
        // incorrectly-ordered negated class collapses `.` through `:` into
        // a range and strips `/` and digits, breaking relative hrefs.
        const html = sanitizeLoginDisclaimer([
            '<a href="/dashboard">x</a>',
            '<a href="docs/help.html">x</a>',
            '<a href="example.com/help">x</a>',
            '<a href="#top">x</a>'
        ].join('\n'));

        expect(html).toContain('href="/dashboard"');
        expect(html).toContain('href="docs/help.html"');
        expect(html).toContain('href="example.com/help"');
        expect(html).toContain('href="#top"');
    });

    it('strips script-executing schemes', () => {
        const html = sanitizeLoginDisclaimer([
            '<a href="javascript:alert(1)">x</a>',
            '<a href="data:text/html,<script>alert(1)</script>">x</a>',
            '<a href="vbscript:msgbox(1)">x</a>'
        ].join('\n'));

        expect(html).not.toContain('javascript:');
        expect(html).not.toContain('data:text/html');
        expect(html).not.toContain('vbscript:');
    });

    it('handles empty or missing input', () => {
        expect(sanitizeLoginDisclaimer('')).toBe('');
        expect(sanitizeLoginDisclaimer(undefined)).toBe('');
        expect(sanitizeLoginDisclaimer(null)).toBe('');
    });
});
/* eslint-enable sonarjs/code-eval */
