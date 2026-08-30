import { describe, expect, it } from 'vitest';

import { LibraryTab } from 'types/libraryTab';

import {
    getAlphabetFilter,
    getAlphabetNavigationSettings,
    getLocalizedAlphabetGroups,
    getPrimaryAlphabetDefinition
} from './alphabet';

const russian = {
    enabled: true,
    locale: 'ru-RU',
    additionalScripts: []
};

const greek = {
    enabled: true,
    locale: 'el-GR',
    additionalScripts: []
};

describe('localized alphabet navigation', () => {
    it('keeps Greek Ψ and Ω at the end of the native alphabet', () => {
        const values = getPrimaryAlphabetDefinition('el-GR')?.values ?? [];
        expect(values.at(-2)).toBe('Ψ');
        expect(values.at(-1)).toBe('Ω');
    });

    it('preserves the Russian alphabet order including Ё, Ч and Я', () => {
        const values = getPrimaryAlphabetDefinition('ru-RU')?.values ?? [];
        expect(values.indexOf('Ё')).toBe(values.indexOf('Е') + 1);
        expect(values.indexOf('Ч')).toBeGreaterThan(values.indexOf('Ц'));
        expect(values.at(-1)).toBe('Я');
    });

    it('keeps legacy filters unchanged while the global feature is disabled', () => {
        const filter = getAlphabetFilter(
            '#',
            { enabled: false, locale: 'ru-RU', additionalScripts: [] },
            LibraryTab.Movies
        );

        expect(filter.params).toBeUndefined();
        expect(filter.query).toEqual({ nameLessThan: 'A', nameStartsWith: undefined });
    });

    it('sends native initial ordering even when no bucket is selected', () => {
        const filter = getAlphabetFilter(null, russian, LibraryTab.Movies);
        const order = filter.params?.nameInitialSortOrder?.split(',') ?? [];

        expect(order[0]).toBe('А');
        expect(order.indexOf('Ч')).toBeGreaterThan(order.indexOf('Ц'));
        expect(order.at(-1)).toBe('Я');
    });

    it('filters Greek titles by their native initial', () => {
        const filter = getAlphabetFilter('Ω', greek, LibraryTab.Movies);
        expect(filter.params?.nameInitials).toBe('Ω');
    });

    it('uses # as Other while preserving the same native sort order', () => {
        const filter = getAlphabetFilter('#', russian, LibraryTab.Movies);

        expect(filter.params?.excludeNameInitials).toBe(filter.params?.nameInitialSortOrder);
        expect(filter.params?.excludeNameInitials).toContain('Ё');
    });

    it('appends Latin after the primary alphabet when Latn is enabled', () => {
        const settings = { ...greek, additionalScripts: ['Latn'] };
        const groups = getLocalizedAlphabetGroups(settings, LibraryTab.Movies);
        const filter = getAlphabetFilter(null, settings, LibraryTab.Movies);
        const order = filter.params?.nameInitialSortOrder?.split(',') ?? [];

        expect(groups).toHaveLength(2);
        expect(groups?.[0].values.at(-1)).toBe('Ω');
        expect(groups?.[1].values[0]).toBe('A');
        expect(order.indexOf('A')).toBeGreaterThan(order.indexOf('Ω'));
    });

    it('does not guess an ambiguous additional alphabet from a script code', () => {
        const groups = getLocalizedAlphabetGroups(
            { ...greek, additionalScripts: ['Cyrl'] },
            LibraryTab.Movies
        );
        expect(groups).toHaveLength(1);
    });

    it('uses Latin only for known Latin locales', () => {
        expect(getPrimaryAlphabetDefinition('en-US')?.id).toBe('latin');
        expect(getPrimaryAlphabetDefinition('hy-AM')).toBeUndefined();
        expect(getPrimaryAlphabetDefinition('ckb')).toBeUndefined();
        expect(getPrimaryAlphabetDefinition('te-IN')).toBeUndefined();
    });

    it('falls back to the legacy API for unsupported locales', () => {
        const filter = getAlphabetFilter(
            'A',
            { enabled: true, locale: 'hy-AM', additionalScripts: [] },
            LibraryTab.Movies
        );
        expect(filter.params).toBeUndefined();
        expect(filter.query.nameStartsWith).toBe('A');
    });

    it('reads the global server configuration from SystemInfo', () => {
        expect(getAlphabetNavigationSettings({
            EnableLocalizedAlphabetNavigation: true,
            LocalizedAlphabetLocale: 'el-GR',
            LocalizedAlphabetAdditionalScripts: ['Latn']
        })).toEqual({
            enabled: true,
            locale: 'el-GR',
            additionalScripts: ['Latn']
        });
    });

    it('keeps endpoints without native-initial support on the legacy API path', () => {
        for (const viewType of [LibraryTab.Authors, LibraryTab.Channels, LibraryTab.SeriesTimers]) {
            const filter = getAlphabetFilter('O', russian, viewType);
            expect(filter.params).toBeUndefined();
            expect(filter.query.nameStartsWith).toBe('O');
        }
    });
});
