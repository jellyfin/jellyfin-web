import { act, renderHook } from '@testing-library/react';
import React, { type PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Events from 'utils/events';

import { UserSettingsProvider, useUserSettings } from './useUserSettings';

const { mockUserSettings, mockUseApi } = vi.hoisted(() => ({
    mockUserSettings: {
        customCss: vi.fn<() => string | undefined>(),
        disableCustomCss: vi.fn<() => boolean>(),
        theme: vi.fn<() => string | undefined>(),
        dashboardTheme: vi.fn<() => string | undefined>(),
        dateTimeLocale: vi.fn<() => string | null | undefined>(),
        language: vi.fn<() => string | null | undefined>(),
        libraryPageSize: vi.fn<() => number | undefined>()
    },
    mockUseApi: vi.fn<() => { user?: { Id: string } }>()
}));

vi.mock('scripts/settings/userSettings', () => ({
    currentSettings: mockUserSettings
}));

vi.mock('lib/globalize', () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    FALLBACK_CULTURE: 'en-us'
}));

vi.mock('./useApi', () => ({
    useApi: mockUseApi
}));

const USER_1 = { Id: 'user-1' };
const USER_2 = { Id: 'user-2' };

const wrapper = ({ children }: PropsWithChildren) => (
    <UserSettingsProvider>{children}</UserSettingsProvider>
);

function renderUserSettings() {
    return renderHook(() => useUserSettings(), { wrapper });
}

function triggerChange(...args: string[]) {
    act(() => {
        Events.trigger(mockUserSettings, 'change', args);
    });
}

describe('useUserSettings', () => {
    beforeEach(() => {
        mockUseApi.mockReturnValue({ user: USER_1 });
        mockUserSettings.customCss.mockReturnValue(undefined);
        mockUserSettings.disableCustomCss.mockReturnValue(false);
        mockUserSettings.theme.mockReturnValue(undefined);
        mockUserSettings.dashboardTheme.mockReturnValue(undefined);
        mockUserSettings.dateTimeLocale.mockReturnValue(undefined);
        mockUserSettings.language.mockReturnValue(undefined);
        mockUserSettings.libraryPageSize.mockReturnValue(undefined);
    });

    it('exposes the user language from user settings as "language"', () => {
        mockUserSettings.language.mockReturnValue('fr');

        const { result } = renderUserSettings();

        expect(result.current.language).toBe('fr');
        // Regression: the language used to be published under a "locale" key
        expect(result.current).not.toHaveProperty('locale');
    });

    it('exposes exactly the tracked user settings', () => {
        mockUserSettings.customCss.mockReturnValue('body {}');
        mockUserSettings.disableCustomCss.mockReturnValue(true);
        mockUserSettings.theme.mockReturnValue('dark');
        mockUserSettings.dashboardTheme.mockReturnValue('light');
        mockUserSettings.dateTimeLocale.mockReturnValue('de');
        mockUserSettings.language.mockReturnValue('nl');
        mockUserSettings.libraryPageSize.mockReturnValue(50);

        const { result } = renderUserSettings();

        expect(result.current).toStrictEqual({
            customCss: 'body {}',
            disableCustomCss: true,
            theme: 'dark',
            dashboardTheme: 'light',
            dateTimeLocale: 'de',
            language: 'nl',
            libraryPageSize: 50
        });
    });

    it('falls back to the default library page size when unset', () => {
        const { result } = renderUserSettings();

        expect(result.current.libraryPageSize).toBe(100);
    });

    it('updates the language when the setting changes', () => {
        mockUserSettings.language.mockReturnValue('fr');
        const { result } = renderUserSettings();
        expect(result.current.language).toBe('fr');

        mockUserSettings.language.mockReturnValue('de');
        triggerChange('language');

        expect(result.current.language).toBe('de');
    });

    // The event names are the raw storage keys used by scripts/settings/userSettings,
    // which do not always match the context property names.
    it.each([
        { event: 'customCss', field: 'customCss', value: 'body {}' },
        { event: 'disableCustomCss', field: 'disableCustomCss', value: true },
        { event: 'appTheme', field: 'theme', value: 'dark' },
        { event: 'dashboardTheme', field: 'dashboardTheme', value: 'light' },
        { event: 'datetimelocale', field: 'dateTimeLocale', value: 'de' },
        { event: 'language', field: 'language', value: 'de' },
        { event: 'libraryPageSize', field: 'libraryPageSize', value: 20 }
    ] as const)('re-reads "$field" on a "$event" change event', ({ event, field, value }) => {
        const { result } = renderUserSettings();
        expect(result.current[field]).not.toBe(value);

        // Indexing by a union key collapses the mock return type to never; the rows are correct by inspection
        mockUserSettings[field].mockReturnValue(value as never);
        triggerChange(event);

        expect(result.current[field]).toBe(value);
    });

    it('ignores changes to settings it does not track', () => {
        mockUserSettings.language.mockReturnValue('fr');
        const { result } = renderUserSettings();
        const before = result.current;

        mockUserSettings.language.mockReturnValue('de');
        triggerChange('someOtherSetting');

        expect(result.current).toBe(before);
        expect(result.current.language).toBe('fr');
    });

    it('ignores change events without a setting name', () => {
        mockUserSettings.language.mockReturnValue('fr');
        const { result } = renderUserSettings();
        const before = result.current;

        mockUserSettings.language.mockReturnValue('de');
        triggerChange();

        expect(result.current).toBe(before);
        expect(result.current.language).toBe('fr');
    });

    it('re-reads the settings only when the user changes', () => {
        mockUserSettings.language.mockReturnValue('fr');
        const { result, rerender } = renderUserSettings();
        expect(result.current.language).toBe('fr');

        // Same user: a re-render must not re-read the settings
        mockUserSettings.language.mockClear();
        rerender();
        expect(mockUserSettings.language).not.toHaveBeenCalled();
        expect(result.current.language).toBe('fr');

        // New user: the settings are re-read
        mockUserSettings.language.mockReturnValue('es');
        mockUseApi.mockReturnValue({ user: USER_2 });
        rerender();
        expect(result.current.language).toBe('es');
    });

    it('stops listening for changes on unmount', () => {
        const { unmount } = renderUserSettings();
        unmount();

        mockUserSettings.language.mockClear();
        triggerChange('language');

        expect(mockUserSettings.language).not.toHaveBeenCalled();
    });
});
