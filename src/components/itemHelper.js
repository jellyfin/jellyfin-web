import { appHost } from './apphost';
import globalize from '../scripts/globalize';

export function getDisplayName(item, options = {}) {
    if (!item) {
        throw new Error('null item passed into getDisplayName');
    }

    if (item.Type === 'Timer') {
        item = item.ProgramInfo || item;
    }

    let name = ((item.Type === 'Program' || item.Type === 'Recording') && (item.IsSeries || item.EpisodeTitle) ? item.EpisodeTitle : item.Name) || '';

    if (item.Type === 'TvChannel') {
        if (item.ChannelNumber) {
            return item.ChannelNumber + ' ' + name;
        }
        return name;
    }
    if (item.Type === 'Episode' && item.ParentIndexNumber === 0) {
        name = globalize.translate('ValueSpecialEpisodeName', name);
    } else if ((item.Type === 'Episode' || item.Type === 'Program' || item.Type === 'Recording') && item.IndexNumber != null && item.ParentIndexNumber != null && options.includeIndexNumber !== false) {
        let displayIndexNumber = item.IndexNumber;

        let number = displayIndexNumber;
        let nameSeparator = ' - ';

        if (options.includeParentInfo !== false) {
            number = 'S' + item.ParentIndexNumber + ':E' + number;
        } else {
            nameSeparator = '. ';
        }

        if (item.IndexNumberEnd) {
            displayIndexNumber = item.IndexNumberEnd;
            number += '-' + displayIndexNumber;
        }

        if (number) {
            name = name ? (number + nameSeparator + name) : number;
        }
    }

    return name;
}

export function supportsAddingToCollection(item) {
    const invalidTypes = ['Genre', 'MusicGenre', 'Studio', 'UserView', 'CollectionFolder', 'Audio', 'Program', 'Timer', 'SeriesTimer'];

    if (item.Type === 'Recording' && item.Status !== 'Completed') {
        return false;
    }

    return !item.CollectionType && invalidTypes.indexOf(item.Type) === -1 && item.MediaType !== 'Photo' && !isLocalItem(item);
}

export function supportsAddingToPlaylist(item) {
    if (item.Type === 'Program') {
        return false;
    }
    if (item.Type === 'TvChannel') {
        return false;
    }
    if (item.Type === 'Timer') {
        return false;
    }
    if (item.Type === 'SeriesTimer') {
        return false;
    }
    if (item.MediaType === 'Photo') {
        return false;
    }

    if (item.Type === 'Recording' && item.Status !== 'Completed') {
        return false;
    }

    if (isLocalItem(item)) {
        return false;
    }
    if (item.CollectionType === 'livetv') {
        return false;
    }

    return item.MediaType || item.IsFolder || item.Type === 'Genre' || item.Type === 'MusicGenre' || item.Type === 'MusicArtist';
}

export function canEdit(user, item) {
    const itemType = item.Type;

    if (itemType === 'UserRootFolder' || itemType === 'UserView') {
        return false;
    }

    if (itemType === 'Program') {
        return false;
    }

    if (itemType === 'Timer') {
        return false;
    }

    if (itemType === 'SeriesTimer') {
        return false;
    }

    if (item.Type === 'Recording' && item.Status !== 'Completed') {
        return false;
    }

    if (isLocalItem(item)) {
        return false;
    }

    return user.Policy.IsAdministrator;
}

export function isLocalItem(item) {
    if (item && item.Id && typeof item.Id === 'string' && item.Id.indexOf('local') === 0) {
        return true;
    }

    return false;
}

export function canIdentify (user, item) {
    const itemType = item.Type;

    return (itemType === 'Movie'
        || itemType === 'Trailer'
        || itemType === 'Series'
        || itemType === 'BoxSet'
        || itemType === 'Person'
        || itemType === 'Book'
        || itemType === 'MusicAlbum'
        || itemType === 'MusicArtist'
        || itemType === 'MusicVideo')
        && user.Policy.IsAdministrator
        && !isLocalItem(item);
}

export function canEditImages (user, item) {
    const itemType = item.Type;

    if (item.MediaType === 'Photo') {
        return false;
    }

    if (itemType === 'UserView') {
        if (user.Policy.IsAdministrator) {
            return true;
        }

        return false;
    }

    if (item.Type === 'Recording' && item.Status !== 'Completed') {
        return false;
    }

    return itemType !== 'Timer' && itemType !== 'SeriesTimer' && canEdit(user, item) && !isLocalItem(item);
}

export function canSync (user, item) {
    if (user && !user.Policy.EnableContentDownloading) {
        return false;
    }

    if (isLocalItem(item)) {
        return false;
    }

    return item.SupportsSync;
}

export function canShare (item, user) {
    if (item.Type === 'Program') {
        return false;
    }
    if (item.Type === 'TvChannel') {
        return false;
    }
    if (item.Type === 'Timer') {
        return false;
    }
    if (item.Type === 'SeriesTimer') {
        return false;
    }
    if (item.Type === 'Recording' && item.Status !== 'Completed') {
        return false;
    }
    if (isLocalItem(item)) {
        return false;
    }
    return user.Policy.EnablePublicSharing && appHost.supports('sharing');
}

export function enableDateAddedDisplay (item) {
    return !item.IsFolder && item.MediaType && item.Type !== 'Program' && item.Type !== 'TvChannel' && item.Type !== 'Trailer';
}

export function canMarkPlayed (item) {
    if (item.Type === 'Program') {
        return false;
    }

    if (item.MediaType === 'Video') {
        if (item.Type !== 'TvChannel') {
            return true;
        }
    } else if (item.MediaType === 'Audio') {
        if (item.Type === 'AudioPodcast') {
            return true;
        }
        if (item.Type === 'AudioBook') {
            return true;
        }
    }

    if (item.Type === 'Series' ||
        item.Type === 'Season' ||
        item.Type === 'BoxSet' ||
        item.MediaType === 'Book' ||
        item.MediaType === 'Recording') {
        return true;
    }

    return false;
}

export function canRate (item) {
    if (item.Type === 'Program'
        || item.Type === 'Timer'
        || item.Type === 'SeriesTimer'
        || item.Type === 'CollectionFolder'
        || item.Type === 'UserView'
        || item.Type === 'Channel'
        || !item.UserData) {
        return false;
    }

    return true;
}

export function canConvert (item, user) {
    if (!user.Policy.EnableMediaConversion) {
        return false;
    }

    if (isLocalItem(item)) {
        return false;
    }

    const mediaType = item.MediaType;
    if (mediaType === 'Book' || mediaType === 'Photo' || mediaType === 'Audio') {
        return false;
    }

    const collectionType = item.CollectionType;
    if (collectionType === 'livetv') {
        return false;
    }

    const type = item.Type;
    if (type === 'Channel' || type === 'Person' || type === 'Year' || type === 'Program' || type === 'Timer' || type === 'SeriesTimer') {
        return false;
    }

    if (item.LocationType === 'Virtual' && !item.IsFolder) {
        return false;
    }

    if (item.IsPlaceHolder) {
        return false;
    }

    return true;
}

export function canRefreshMetadata (item, user) {
    if (user.Policy.IsAdministrator) {
        const collectionType = item.CollectionType;
        if (collectionType === 'livetv') {
            return false;
        }

        return item.Type !== 'Timer' && item.Type !== 'SeriesTimer' && item.Type !== 'Program'
            && item.Type !== 'TvChannel'
            && !(item.Type === 'Recording' && item.Status !== 'Completed')
            && !isLocalItem(item);
    }

    return false;
}

export function supportsMediaSourceSelection (item) {
    if (item.MediaType !== 'Video') {
        return false;
    }
    if (item.Type === 'TvChannel') {
        return false;
    }
    if (!item.MediaSources || (item.MediaSources.length === 1 && item.MediaSources[0].Type === 'Placeholder')) {
        return false;
    }
    if (item.EnableMediaSourceDisplay === false) {
        return false;
    }
    if (item.EnableMediaSourceDisplay == null && item.SourceType && item.SourceType !== 'Library') {
        return false;
    }

    return true;
}

export function sortTracks (trackA, trackB) {
    let cmp = trackA.IsExternal - trackB.IsExternal;
    if (cmp != 0) return cmp;
    cmp = trackB.IsForced - trackA.IsForced;
    if (cmp != 0) return cmp;
    cmp = trackB.IsDefault - trackA.IsDefault;
    if (cmp != 0) return cmp;

    return trackA.Index - trackB.Index;
}

export default {
    getDisplayName: getDisplayName,
    supportsAddingToCollection: supportsAddingToCollection,
    supportsAddingToPlaylist: supportsAddingToPlaylist,
    isLocalItem: isLocalItem,
    canIdentify: canIdentify,
    canEdit: canEdit,
    canEditImages: canEditImages,
    canSync: canSync,
    canShare: canShare,
    enableDateAddedDisplay: enableDateAddedDisplay,
    canMarkPlayed: canMarkPlayed,
    canRate: canRate,
    canConvert: canConvert,
    canRefreshMetadata: canRefreshMetadata,
    supportsMediaSourceSelection: supportsMediaSourceSelection,
    sortTracks: sortTracks
};
