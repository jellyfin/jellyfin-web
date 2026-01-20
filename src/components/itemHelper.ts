export interface BaseItem {
    Id: string;
    Type: string;
    MediaType?: string;
    IsFolder?: boolean;
    RunTimeTicks?: number;
    [key: string]: any;
}

export const itemHelper = {
    isLocalItem: (item: BaseItem): boolean => {
        return !!(item.Path && (item.Path.indexOf('file://') === 0 || item.Path.indexOf('/') === 0 || item.Path.indexOf('\\') === 0));
    },

    canPlay: (item: BaseItem): boolean => {
        return !item.IsFolder || item.Type === 'MusicArtist' || item.Type === 'MusicGenre';
    }
};

export default itemHelper;