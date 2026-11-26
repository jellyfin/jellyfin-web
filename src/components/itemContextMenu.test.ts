import { beforeEach, describe, expect, it, vi } from 'vitest';

import browser from '../scripts/browser';
import itemHelper from './itemHelper';
import { getCommands } from './itemContextMenu';

vi.mock('../scripts/browser', () => ({ default: { tv: true } }));
vi.mock('../scripts/clipboard', () => ({ copy: vi.fn() }));
vi.mock('../utils/dom', () => ({ default: { parentWithClass: () => ({}) } }));
vi.mock('../lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('./actionSheet/actionSheet', () => ({ default: {} }));
vi.mock('./apphost', () => ({ appHost: { supports: () => false } }));
vi.mock('./router/appRouter', () => ({ appRouter: {} }));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));
vi.mock('./toast/toast', () => ({ default: vi.fn() }));
vi.mock('../scripts/settings/userSettings', () => ({}));
vi.mock('./playback/playbackmanager', () => ({
    playbackManager: {
        canPlay: () => false,
        canQueue: () => false,
        getCurrentPlayer: () => null
    }
}));
vi.mock('./itemHelper', () => ({
    canEditPlaylist: vi.fn(),
    default: {
        supportsAddingToCollection: vi.fn(() => true),
        supportsAddingToPlaylist: vi.fn(() => true),
        canEdit: () => false,
        canEditImages: () => false,
        canEditSubtitles: () => false,
        canEditLyrics: () => false,
        canIdentify: () => false,
        canRefreshMetadata: () => false
    }
}));

function options(isAdministrator = false, enableCollectionManagement = true) {
    return {
        item: { Id: 'movie-id', Type: 'Movie', MediaType: 'Video' },
        user: { Policy: {
            IsAdministrator: isAdministrator,
            EnableCollectionManagement: enableCollectionManagement
        } },
        positionTo: document.createElement('button')
    };
}

describe('Collection and playlist context menu actions', () => {
    beforeEach(() => {
        browser.tv = true;
        vi.mocked(itemHelper.supportsAddingToCollection).mockReturnValue(true);
        vi.mocked(itemHelper.supportsAddingToPlaylist).mockReturnValue(true);
    });

    it.each([true, false])('offers both actions with TV detection set to %s', async (tv) => {
        browser.tv = tv;
        const ids = (await getCommands(options())).map(command => command.id);
        expect(ids).toContain('addtocollection');
        expect(ids).toContain('addtoplaylist');
        expect(ids.includes('multiSelect')).toBe(!tv);
    });

    it('does not offer collection management without permission on a TV', async () => {
        const ids = (await getCommands(options(false, false))).map(command => command.id);
        expect(ids).not.toContain('addtocollection');
        expect(ids).toContain('addtoplaylist');
    });

    it('allows administrators to manage collections on a TV', async () => {
        const ids = (await getCommands(options(true, false))).map(command => command.id);
        expect(ids).toContain('addtocollection');
    });

    it('does not offer collection or playlist actions for unsupported items', async () => {
        vi.mocked(itemHelper.supportsAddingToCollection).mockReturnValue(false);
        vi.mocked(itemHelper.supportsAddingToPlaylist).mockReturnValue(false);
        const ids = (await getCommands(options())).map(command => command.id);
        expect(ids).not.toContain('addtocollection');
        expect(ids).not.toContain('addtoplaylist');
    });

    it('respects the caller disabling playlists on a TV', async () => {
        const ids = (await getCommands({ ...options(), playlist: false })).map(command => command.id);
        expect(ids).not.toContain('addtoplaylist');
        expect(ids).toContain('addtocollection');
    });
});
