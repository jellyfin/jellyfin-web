import { describe, expect, it, vi } from 'vitest';

import { getDisplayName } from './itemHelper';

vi.mock('./apphost', () => ({ appHost: { supports: vi.fn() } }));
vi.mock('lib/globalize', () => ({ default: { translate: vi.fn((key, ...args) => args[0] ?? key) } }));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));
vi.mock('utils/jellyfin-apiclient/compat', () => ({ toApi: vi.fn() }));
vi.mock('scripts/settings/userSettings', () => ({ shouldUseOriginalTitles: vi.fn() }));

import { shouldUseOriginalTitles } from 'scripts/settings/userSettings';

describe('getDisplayName', () => {
    describe('shouldUseOriginalTitles preference', () => {
        it('should return OriginalTitle when preference is enabled and OriginalTitle is available', () => {
            shouldUseOriginalTitles.mockReturnValue(true);
            const item = { Type: 'Movie', Name: 'Spirited Away', OriginalTitle: '千と千尋の神隠し' };
            expect(getDisplayName(item)).toBe('千と千尋の神隠し');
        });

        it('should return Name when preference is enabled but OriginalTitle is not set', () => {
            shouldUseOriginalTitles.mockReturnValue(true);
            const item = { Type: 'Movie', Name: 'Spirited Away' };
            expect(getDisplayName(item)).toBe('Spirited Away');
        });

        it('should return Name when preference is disabled even if OriginalTitle is available', () => {
            shouldUseOriginalTitles.mockReturnValue(false);
            const item = { Type: 'Movie', Name: 'Spirited Away', OriginalTitle: '千と千尋の神隠し' };
            expect(getDisplayName(item)).toBe('Spirited Away');
        });

        it('should return EpisodeTitle for Program regardless of OriginalTitle when preference is enabled', () => {
            shouldUseOriginalTitles.mockReturnValue(true);
            const item = { Type: 'Program', Name: 'Show Name', OriginalTitle: 'Original Show Name', EpisodeTitle: 'Episode Title' };
            expect(getDisplayName(item)).toBe('Episode Title');
        });
    });
});
