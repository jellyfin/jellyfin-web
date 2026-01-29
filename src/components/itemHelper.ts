export interface BaseItem {
    Id?: string | null;
    Type?: string | null;
    MediaType?: string | null;
    IsFolder?: boolean | null;
    RunTimeTicks?: number | null;
    [key: string]: any;
}

export const itemHelper = {
    isLocalItem: (item: BaseItem): boolean => {
        return !!(
            item.Path &&
            (item.Path.indexOf('file://') === 0 ||
                item.Path.indexOf('/') === 0 ||
                item.Path.indexOf('\\') === 0)
        );
    },

    canPlay: (item: BaseItem): boolean => {
        return !item.IsFolder || item.Type === 'MusicArtist' || item.Type === 'MusicGenre';
    },

    getDisplayName: (item: BaseItem, options: { includeIndexNumber?: boolean } = {}): string => {
        if (item.Type === 'Episode') {
            const seriesName = item.SeriesName || '';
            const episodeName = item.Name || '';

            if (options.includeIndexNumber) {
                return `${seriesName} - S${item.ParentIndexNumber?.toString().padStart(2, '0') || '00'}E${item.IndexNumber?.toString().padStart(2, '0') || '00'}${episodeName ? ` - ${episodeName}` : ''}`;
            }
            return episodeName || seriesName;
        } else if (item.Type === 'Series' || item.Type === 'Season') {
            return item.Name || '';
        } else if (item.Album || item.Type === 'Audio' || item.Type === 'MusicAlbum') {
            return item.Album || item.Name || '';
        } else if (item.ProductionYear) {
            return `${item.Name || ''} (${item.ProductionYear})`;
        }
        return item.Name || '';
    },

    canRefreshMetadata: (_item: BaseItem, _user: any): boolean => {
        return true;
    },

    supportsMediaSourceSelection: (item: BaseItem): boolean => {
        return !!(item.MediaSources && item.MediaSources.length > 1);
    },

    canMarkPlayed: (item: BaseItem): boolean => {
        return true;
    },

    canRate: (item: BaseItem): boolean => {
        return true;
    },

    supportsAddingToCollection: (item: BaseItem): boolean => {
        return (
            !item.IsFolder &&
            ['Movie', 'Series', 'MusicAlbum', 'MusicArtist', 'MusicGenre'].includes(item.Type || '')
        );
    },

    supportsAddingToPlaylist: (item: BaseItem): boolean => {
        return (
            !item.IsFolder &&
            ['Audio', 'MusicAlbum', 'MusicArtist', 'MusicGenre'].includes(item.Type || '')
        );
    },

    enableDateAddedDisplay: (item: BaseItem): boolean => {
        return item.Type !== 'MusicArtist' && item.Type !== 'MusicGenre';
    },

    sortTracks: (a: any, b: any): number => {
        return (a.Type || '').localeCompare(b.Type || '');
    }
};

export interface User {
    Policy?: {
        EnableContentDeletion?: boolean;
        EnableContentDownloading?: boolean;
        IsAdministrator?: boolean;
    };
    Id?: string;
}

export async function canEditPlaylist(user: User | null, item: BaseItem): Promise<boolean> {
    if (!user || !item) return false;
    if (user.Policy?.IsAdministrator) return true;
    if (item.Type !== 'Playlist') return false;
    return item.UserId === user.Id || item.CanEdit === true;
}

export default itemHelper;
