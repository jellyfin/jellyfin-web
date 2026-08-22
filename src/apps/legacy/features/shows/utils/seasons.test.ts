import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { describe, expect, it } from 'vitest';

import { getPreferredSeasonId } from './seasons';

const TEST_SEASONS: BaseItemDto[] = [
    { Id: 'season-1', Name: 'Season 1' },
    { Id: 'season-2', Name: 'Season 2' },
    { Id: 'season-3', Name: 'Season 3' }
];

describe('getPreferredSeasonId()', () => {
    it('Should return the season of the next up episode', () => {
        expect(getPreferredSeasonId(TEST_SEASONS, { Id: 'episode', SeasonId: 'season-2' }))
            .toBe('season-2');
    });

    it('Should return the first season if there is no next up episode', () => {
        expect(getPreferredSeasonId(TEST_SEASONS)).toBe('season-1');
        expect(getPreferredSeasonId(TEST_SEASONS, null)).toBe('season-1');
    });

    it('Should return the first season if the next up season is missing from the list', () => {
        expect(getPreferredSeasonId(TEST_SEASONS, { Id: 'episode', SeasonId: 'specials' }))
            .toBe('season-1');
        expect(getPreferredSeasonId(TEST_SEASONS, { Id: 'episode' })).toBe('season-1');
    });

    it('Should skip seasons without an id', () => {
        expect(getPreferredSeasonId([{ Name: 'Season 1' }, { Id: 'season-2' }]))
            .toBe('season-2');
    });

    it('Should prefer a requested season over the next up season', () => {
        expect(getPreferredSeasonId(TEST_SEASONS, { Id: 'episode', SeasonId: 'season-2' }, 'season-3'))
            .toBe('season-3');
    });

    it('Should ignore a requested season that is missing from the list', () => {
        expect(getPreferredSeasonId(TEST_SEASONS, { Id: 'episode', SeasonId: 'season-2' }, 'specials'))
            .toBe('season-2');
        expect(getPreferredSeasonId(TEST_SEASONS, null, 'specials')).toBe('season-1');
    });

    it('Should return undefined if there are no seasons', () => {
        expect(getPreferredSeasonId([])).toBeUndefined();
        expect(getPreferredSeasonId([], { Id: 'episode', SeasonId: 'season-1' }))
            .toBeUndefined();
    });
});
