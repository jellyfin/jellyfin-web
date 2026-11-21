import { describe, expect, it } from 'vitest';

import { markdownToHtml } from './markdown';

describe('markdownToHtml()', () => {
    it('Should convert markdown to HTML', () => {
        expect(markdownToHtml('**bold**')).toBe('<p><strong>bold</strong></p>\n');
    });

    it('Should keep HTML from the markdown source', () => {
        expect(markdownToHtml('<b>bold</b> text'))
            .toBe('<p><b>bold</b> text</p>\n');
    });
});
