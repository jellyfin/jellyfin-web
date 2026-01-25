import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { DeviceInfo } from '@jellyfin/sdk/lib/generated-client/models/device-info';
import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import { describe, expect, it } from 'vitest';

import { getItemTypeIcon, getLibraryIcon, getDeviceIcon } from './image';

const ITEM_ICON_MAP: Record<string, string | undefined> = {
    AggregateFolder: undefined,
    Audio: 'audiotrack',
    AudioBook: undefined,
    BasePluginFolder: undefined,
    Book: 'book',
    BoxSet: 'video_library',
    Channel: undefined,
    ChannelFolderItem: undefined,
    CollectionFolder: undefined,
    Episode: 'tv',
    Folder: 'folder',
    Genre: undefined,
    LiveTvChannel: undefined,
    LiveTvProgram: undefined,
    ManualPlaylistsFolder: undefined,
    Movie: 'movie',
    MusicAlbum: 'album',
    MusicArtist: 'person',
    MusicGenre: undefined,
    MusicVideo: undefined,
    Person: 'person',
    Photo: 'photo',
    PhotoAlbum: 'photo_album',
    Playlist: 'queue',
    PlaylistsFolder: undefined,
    Program: 'live_tv',
    Recording: undefined,
    Season: undefined,
    Series: 'tv',
    Studio: undefined,
    Trailer: undefined,
    TvChannel: undefined,
    TvProgram: undefined,
    UserRootFolder: undefined,
    UserView: undefined,
    Video: undefined,
    Year: undefined
};

const LIBRARY_ICON_MAP: Record<string, string | undefined> = {
    Books: 'book',
    Boxsets: 'video_library',
    Folders: 'folder',
    Homevideos: 'photo',
    Livetv: 'live_tv',
    Movies: 'movie',
    Music: 'music_note',
    Musicvideos: 'music_video',
    Photos: 'photo',
    Playlists: 'queue',
    Trailers: 'theaters',
    Tvshows: 'tv',
    Unknown: 'folder'
};

describe('getItemTypeIcon()', () => {
    it('Should return the correct icon for item type', () => {
        Object.entries(BaseItemKind).forEach(([key, value]) => {
            expect(Object.prototype.hasOwnProperty.call(ITEM_ICON_MAP, key)).toBe(true);
            expect(`${key}=${getItemTypeIcon(value)}`).toBe(`${key}=${ITEM_ICON_MAP[key]}`);
        });
    });

    it('Should return the default icon for unknown type if provided', () => {
        expect(getItemTypeIcon('foobar', 'default')).toBe('default');
    });

    it('Should return undefined for unknown type', () => {
        expect(getItemTypeIcon('foobar')).toBeUndefined();
    });
});

describe('getLibraryIcon()', () => {
    it('Should return the correct icon for collection type', () => {
        Object.entries(CollectionType).forEach(([key, value]) => {
            expect(Object.prototype.hasOwnProperty.call(LIBRARY_ICON_MAP, key)).toBe(true);
            expect(`${key}=${getLibraryIcon(value)}`).toBe(`${key}=${LIBRARY_ICON_MAP[key]}`);
        });
    });

    it('Should return the correct icon for nonstandard types', () => {
        expect(getLibraryIcon(undefined)).toBe('quiz');
        expect(getLibraryIcon('channels')).toBe('videocam');
    });

    it('Should return the default icon for unknown types', () => {
        expect(getLibraryIcon('foobar')).toBe('folder');
    });
});

describe('getDeviceIcon()', () => {
    it('should return correct icon for common devices', () => {
        expect(getDeviceIcon({ AppName: 'Samsung Smart TV' } as DeviceInfo)).toBe('assets/img/devices/samsungtv.svg');
        expect(getDeviceIcon({ AppName: 'Kodi' } as DeviceInfo)).toBe('assets/img/devices/kodi.svg');
        expect(getDeviceIcon({ AppName: 'Jellyfin Roku' } as DeviceInfo)).toBe('assets/img/devices/roku.svg');
    });

    it('should handle session info as device info', () => {
        expect(getDeviceIcon({ Client: 'Jellyfin Web' } as SessionInfo)).toBe('assets/img/devices/html5.svg');
    });

    it('should handle unknown device', () => {
        expect(getDeviceIcon({ Name: 'Unknown Device' } as DeviceInfo)).toBe('assets/img/devices/other.svg');
    });

    it('should use IconUrl from capabilities when available', () => {
        const deviceWithIcon = {
            Name: 'Custom Device',
            Capabilities: {
                IconUrl: 'https://example.com/icon.png'
            }
        } as DeviceInfo;

        expect(getDeviceIcon(deviceWithIcon)).toBe('https://example.com/icon.png');
    });

    it('should handle invalid IconUrl gracefully', () => {
        const deviceWithInvalidIcon = {
            Name: 'Custom Device',
            Capabilities: {
                IconUrl: 'invalid-url'
            }
        } as DeviceInfo;

        expect(getDeviceIcon(deviceWithInvalidIcon)).toBe('assets/img/devices/other.svg');
    });
});
