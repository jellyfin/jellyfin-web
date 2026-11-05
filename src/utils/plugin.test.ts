import { describe, expect, it } from 'vitest';

import { getPluginUrl } from './plugin';

describe('getPluginUrl', () => {
    it('Should return the configuration page path', () => {
        expect(getPluginUrl('MyPlugin')).toBe('configurationpage?name=MyPlugin');
    });

    it('Should encode the page name', () => {
        expect(getPluginUrl('My Plugin & Co')).toBe('configurationpage?name=My%20Plugin%20%26%20Co');
    });
});
