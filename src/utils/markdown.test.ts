import { describe, expect, it } from 'vitest';

import { getMarkdown } from './markdown';

describe('getMarkdown()', () => {
    it('Should return the same instance on every call', () => {
        expect(getMarkdown()).toBe(getMarkdown());
    });

    it('Should keep HTML from the markdown source', () => {
        expect(getMarkdown().render('<b>bold</b> text'))
            .toBe('<p><b>bold</b> text</p>\n');
    });
});
