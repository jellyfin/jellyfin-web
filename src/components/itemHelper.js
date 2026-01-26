import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';
import { RecordingStatus } from '@jellyfin/sdk/lib/generated-client/models/recording-status';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';

import { appHost } from './apphost';
import { AppFeature } from 'constants/appFeature';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';

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
    if (item.CollectionType === CollectionType.Livetv) {
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
    return item?.Id && typeof item.Id === 'string' && item.Id.indexOf('local') === 0;
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
        return !!user.Policy.IsAdministrator;
    }

    if (item.Type === 'Recording' && item.Status !== 'Completed') {
        return false;
    }

    return itemType !== 'Timer' && itemType !== 'SeriesTimer' && canEdit(user, item) && !isLocalItem(item);
}

export async function canEditPlaylist(user, item) {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    const api = toApi(apiClient);

    try {
        const { data: permissions } = await getPlaylistsApi(api)
            .getPlaylistUser({
                userId: user.Id,
                playlistId: item.Id
            });

        return !!permissions.CanEdit;
    } catch (err) {
        console.error('Failed to get playlist permissions', err);
    }

    return false;
}

export function canEditSubtitles (user, item) {
    if (item.MediaType !== MediaType.Video) {
        return false;
    }
    const itemType = item.Type;
    if (itemType === BaseItemKind.Recording && item.Status !== RecordingStatus.Completed) {
        return false;
    }
    if (itemType === BaseItemKind.TvChannel
        || itemType === BaseItemKind.Program
        || itemType === 'Timer'
        || itemType === 'SeriesTimer'
        || itemType === BaseItemKind.UserRootFolder
        || itemType === BaseItemKind.UserView
    ) {
        return false;
    }
    if (isLocalItem(item)) {
        return false;
    }
    if (item.LocationType === LocationType.Virtual) {
        return false;
    }
    return user.Policy.EnableSubtitleManagement
           || user.Policy.IsAdministrator;
}

export function canEditLyrics (user, item) {
    if (item.MediaType !== MediaType.Audio) {
        return false;
    }
    if (isLocalItem(item)) {
        return false;
    }
    return user.Policy.IsAdministrator;
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
    return user.Policy.EnablePublicSharing && appHost.supports(AppFeature.Sharing);
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
        if (item.Type === 'AudioBook') {
            return true;
        }
    }

    return item.Type === 'Series'
        || item.Type === 'Season'
        || item.Type === 'BoxSet'
        || item.MediaType === 'Book';
}

export function canRate (item) {
    return item.Type !== 'Program'
        && item.Type !== 'Timer'
        && item.Type !== 'SeriesTimer'
        && item.Type !== 'CollectionFolder'
        && item.Type !== 'UserView'
        && item.Type !== 'Channel'
        && item.UserData;
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
    if (collectionType === CollectionType.Livetv) {
        return false;
    }

    const type = item.Type;
    if (type === 'Channel' || type === 'Person' || type === 'Year' || type === 'Program' || type === 'Timer' || type === 'SeriesTimer') {
        return false;
    }

    if (item.LocationType === 'Virtual' && !item.IsFolder) {
        return false;
    }

    return !item.IsPlaceHolder;
}

export function canRefreshMetadata (item, user) {
    if (user.Policy.IsAdministrator) {
        const collectionType = item.CollectionType;
        if (collectionType === CollectionType.Livetv) {
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

    if (item.EnableMediaSourceDisplay != null) {
        return !!item.EnableMediaSourceDisplay;
    }

    return !item.SourceType || item.SourceType === 'Library';
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
    canEditSubtitles,
    canEditLyrics,
    canShare: canShare,
    enableDateAddedDisplay: enableDateAddedDisplay,
    canMarkPlayed: canMarkPlayed,
    canRate: canRate,
    canConvert: canConvert,
    canRefreshMetadata: canRefreshMetadata,
    supportsMediaSourceSelection: supportsMediaSourceSelection,
    sortTracks: sortTracks
};
