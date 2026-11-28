import type { Api } from '@jellyfin/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchConfigurationPages, selectConfigurationPages } from './useConfigurationPages';

const getConfigurationPagesMock = vi.fn();

vi.mock('@jellyfin/sdk/lib/utils/api/plugin-api', () => ({
    getPluginApi: () => ({ getConfigurationPages: getConfigurationPagesMock })
}));

vi.mock('hooks/useApi', () => ({
    useApi: () => ({})
}));

const api = {} as Api;
const pages = [{ Name: 'user_report', EnableInMainMenu: true, DisplayName: 'Playback Reporting', PluginId: 'a' }];

const invalidData: [ string, unknown ][] = [
    [ 'an empty body', '' ],
    [ 'an HTML body', '<!DOCTYPE html><html></html>' ],
    [ 'null', null ],
    [ 'an object', {} ]
];

describe('fetchConfigurationPages', () => {
    beforeEach(() => {
        getConfigurationPagesMock.mockReset();
    });

    it('returns the page list', async () => {
        getConfigurationPagesMock.mockResolvedValue({ data: pages });

        await expect(fetchConfigurationPages(api, { enableInMainMenu: true })).resolves.toBe(pages);
        expect(getConfigurationPagesMock).toHaveBeenCalledWith({ enableInMainMenu: true }, undefined);
    });

    it.each(invalidData)('throws when the response is %s', async (_, data) => {
        getConfigurationPagesMock.mockResolvedValue({ data });

        await expect(fetchConfigurationPages(api)).rejects.toThrow(TypeError);
    });
});

describe('selectConfigurationPages', () => {
    it('keeps a valid page list', () => {
        expect(selectConfigurationPages(pages)).toBe(pages);
    });

    it.each(invalidData)('returns an empty list for %s', (_, data) => {
        expect(selectConfigurationPages(data)).toEqual([]);
    });
});
