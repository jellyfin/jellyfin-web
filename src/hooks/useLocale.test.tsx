import { act, renderHook, waitFor } from '@testing-library/react';
import type { Locale } from 'date-fns';
import React, { type PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Events from 'utils/events';

import { useLocale } from './useLocale';
import { UserSettingsProvider } from './useUserSettings';

const {
    mockUserSettings,
    mockGetDefaultLanguage,
    mockNormalizeLocaleName,
    mockFetchLocale
} = vi.hoisted(() => ({
    mockUserSettings: {
        customCss: vi.fn<() => string | undefined>(),
        disableCustomCss: vi.fn<() => boolean>(() => false),
        theme: vi.fn<() => string | undefined>(),
        dashboardTheme: vi.fn<() => string | undefined>(),
        dateTimeLocale: vi.fn<() => string | null | undefined>(),
        language: vi.fn<() => string | null | undefined>(),
        libraryPageSize: vi.fn<() => number | undefined>()
    },
    mockGetDefaultLanguage: vi.fn(() => 'en-US'),
    // Mirrors lib/globalize normalizeLocaleName; the real module has import-time side effects
    mockNormalizeLocaleName: vi.fn((culture: string) => culture.replace('_', '-').toLowerCase()),
    // By default never resolves, so tests that do not care about date-fns do no background work
    mockFetchLocale: vi.fn<(localeName: string) => Promise<Locale>>(() => new Promise(() => { /* pending */ }))
}));

vi.mock('scripts/settings/userSettings', () => ({
    currentSettings: mockUserSettings
}));

vi.mock('lib/globalize', () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    FALLBACK_CULTURE: 'en-us',
    getDefaultLanguage: mockGetDefaultLanguage,
    normalizeLocaleName: mockNormalizeLocaleName
}));

vi.mock('utils/dateFnsLocale', async (importOriginal) => ({
    ...await importOriginal<typeof import('utils/dateFnsLocale')>(),
    fetchLocale: mockFetchLocale
}));

const USER = { Id: 'user-1' };

vi.mock('./useApi', () => ({
    useApi: () => ({ user: USER })
}));

const wrapper = ({ children }: PropsWithChildren) => (
    <UserSettingsProvider>{children}</UserSettingsProvider>
);

function renderLocale() {
    return renderHook(() => useLocale(), { wrapper });
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/** Routes fetchLocale calls to per-locale deferreds so tests control resolution order. */
function controlFetchLocale() {
    const pending: Record<string, ReturnType<typeof deferred<Locale>>> = {};
    mockFetchLocale.mockImplementation(name => {
        pending[name] ??= deferred<Locale>();
        return pending[name].promise;
    });
    const requested = (name: string) => {
        const request = pending[name];
        if (!request) throw new Error(`fetchLocale('${name}') was never requested`);
        return request;
    };
    return {
        resolve: async (name: string, code = name) => {
            const request = requested(name);
            await act(async () => {
                request.resolve({ code } as Locale);
            });
        },
        reject: async (name: string, reason: unknown) => {
            const request = requested(name);
            await act(async () => {
                request.reject(reason);
            });
        }
    };
}

describe('useLocale', () => {
    beforeEach(() => {
        mockUserSettings.language.mockReturnValue(undefined);
        mockUserSettings.dateTimeLocale.mockReturnValue(undefined);
        // restoreMocks already does this; stated explicitly because the tests below rely on it
        mockGetDefaultLanguage.mockReset().mockReturnValue('en-US');
        mockFetchLocale.mockReset().mockImplementation(() => new Promise(() => { /* pending */ }));
    });

    describe('locale', () => {
        it('uses the user language setting', () => {
            mockUserSettings.language.mockReturnValue('fr');

            const { result } = renderLocale();

            expect(result.current.locale).toBe('fr');
            expect(mockGetDefaultLanguage).not.toHaveBeenCalled();
        });

        it('normalizes the user language setting', () => {
            mockUserSettings.language.mockReturnValue('pt_BR');

            const { result } = renderLocale();

            expect(mockNormalizeLocaleName).toHaveBeenCalledWith('pt_BR');
            expect(result.current.locale).toBe('pt-br');
        });

        // The settings store returns null when unset and '' when the user picks "auto"
        it.each([ undefined, null, '' ])('falls back to the default language when the setting is %j', value => {
            mockUserSettings.language.mockReturnValue(value);
            mockGetDefaultLanguage.mockReturnValue('de-DE');

            const { result } = renderLocale();

            expect(result.current.locale).toBe('de-de');
        });

        it('updates when the user language setting changes', () => {
            mockUserSettings.language.mockReturnValue('fr');
            const { result } = renderLocale();
            expect(result.current.locale).toBe('fr');

            mockUserSettings.language.mockReturnValue('de');
            act(() => {
                Events.trigger(mockUserSettings, 'change', [ 'language' ]);
            });

            expect(result.current.locale).toBe('de');
        });
    });

    describe('dateTimeLocale', () => {
        it.each([ undefined, null, '' ])('falls back to the locale when the setting is %j', value => {
            mockUserSettings.language.mockReturnValue('fr');
            mockUserSettings.dateTimeLocale.mockReturnValue(value);

            const { result } = renderLocale();

            expect(result.current.dateTimeLocale).toBe('fr');
        });

        it('uses the date time locale setting when set', () => {
            mockUserSettings.language.mockReturnValue('fr');
            mockUserSettings.dateTimeLocale.mockReturnValue('en_GB');

            const { result } = renderLocale();

            expect(result.current.locale).toBe('fr');
            expect(result.current.dateTimeLocale).toBe('en-gb');
        });

        it('follows the locale when the user language setting changes', () => {
            mockUserSettings.language.mockReturnValue('fr');
            const { result } = renderLocale();

            mockUserSettings.language.mockReturnValue('de');
            act(() => {
                Events.trigger(mockUserSettings, 'change', [ 'language' ]);
            });

            expect(result.current.dateTimeLocale).toBe('de');
        });
    });

    describe('dateFnsLocale', () => {
        it('defaults to en-US before a locale is loaded', () => {
            mockUserSettings.language.mockReturnValue('fr');

            const { result } = renderLocale();

            expect(result.current.dateFnsLocale.code).toBe('en-US');
        });

        it('loads the mapped date-fns locale for the date time locale', async () => {
            const fetches = controlFetchLocale();
            mockUserSettings.language.mockReturnValue('fr');
            mockUserSettings.dateTimeLocale.mockReturnValue('fr-be');

            const { result } = renderLocale();

            // 'fr-be' has no exact date-fns locale and falls back to 'fr'
            expect(mockFetchLocale).toHaveBeenLastCalledWith('fr');
            await fetches.resolve('fr');
            expect(result.current.dateFnsLocale.code).toBe('fr');
        });

        it('ignores a stale response from a previous locale', async () => {
            const fetches = controlFetchLocale();
            mockUserSettings.language.mockReturnValue('fr');

            const { result } = renderLocale();

            // The provider starts from the fallback culture before reading the user
            // settings, so the hook first requests en-US and then fr.
            expect(mockFetchLocale.mock.calls.map(([ name ]) => name)).toEqual([ 'en-US', 'fr' ]);

            await fetches.resolve('fr');
            expect(result.current.dateFnsLocale.code).toBe('fr');

            // The slower en-US response must not overwrite the current locale
            await fetches.resolve('en-US');
            expect(result.current.dateFnsLocale.code).toBe('fr');
        });

        it('ignores a stale response after the language changes', async () => {
            const fetches = controlFetchLocale();
            mockUserSettings.language.mockReturnValue('fr');
            const { result } = renderLocale();

            mockUserSettings.language.mockReturnValue('de');
            act(() => {
                Events.trigger(mockUserSettings, 'change', [ 'language' ]);
            });
            expect(mockFetchLocale).toHaveBeenLastCalledWith('de');

            await fetches.resolve('de');
            expect(result.current.dateFnsLocale.code).toBe('de');

            await fetches.resolve('fr');
            expect(result.current.dateFnsLocale.code).toBe('de');
        });

        it('keeps the previous locale and warns when loading fails', async () => {
            const fetches = controlFetchLocale();
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => { /* silence */ });
            const error = new Error('boom');
            mockUserSettings.language.mockReturnValue('fr');

            const { result } = renderLocale();
            await fetches.resolve('fr');
            expect(result.current.dateFnsLocale.code).toBe('fr');

            mockUserSettings.language.mockReturnValue('de');
            act(() => {
                Events.trigger(mockUserSettings, 'change', [ 'language' ]);
            });
            await fetches.reject('de', error);

            expect(warn).toHaveBeenCalledWith('[useLocale] failed to fetch dateFns locale', error);
            expect(result.current.dateFnsLocale.code).toBe('fr');
        });

        it('loads the real date-fns locale module', async () => {
            const { fetchLocale } = await vi.importActual<typeof import('utils/dateFnsLocale')>('utils/dateFnsLocale');
            mockFetchLocale.mockImplementation(fetchLocale);
            mockUserSettings.language.mockReturnValue('fr');

            const { result } = renderLocale();

            await waitFor(() => {
                expect(result.current.dateFnsLocale.code).toBe('fr');
            }, { timeout: 3000 });
        });
    });
});
