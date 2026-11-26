import { describe, expect, it } from 'vitest';

import { normalizeModuleKey } from './moduleKey';

describe('Utils: moduleKey', () => {
    describe('Function: normalizeModuleKey', () => {
        it.each([
            [ 'quickConnect/index.tsx?raw', 'quickConnect' ],
            [ 'quickConnect/index.tsx#hash', 'quickConnect' ],
            [ './itemDetails/index', 'itemDetails' ],
            [ 'itemDetails/index.html', 'itemDetails' ],
            [ 'itemDetails/', 'itemDetails' ],
            [ 'user\\settings.tsx', 'user/settings' ],
            [ 'user/settings.tsx', 'user/settings' ],
            [ 'schedulesdirect.template.html', 'schedulesdirect.template' ],
            [ 'en-us.json', 'en-us' ],
            [ 'index.tsx', '' ],
            [ 'index', '' ],
            [ '', '' ]
        ])('Should normalise "%s" to "%s"', (modulePath, expected) => {
            expect(normalizeModuleKey(modulePath)).toBe(expected);
        });
    });
});
