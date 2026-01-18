import { ServerConnections } from 'lib/jellyfin-apiclient';
import { modifyQueryWithFilters } from '../../utils/queryUtils';

const DEFAULT_START_INDEX = 0;
const DEFAULT_LIMIT = 300;

export function getInitialLiveTvQuery(instance, params) {
    const startIndex = DEFAULT_START_INDEX;
    const limit = DEFAULT_LIMIT;
    
    const query = {
        UserId: ServerConnections.getApiClient(params.serverId).getCurrentUserId(),
        StartIndex: startIndex,
        Fields: 'ChannelInfo,PrimaryImageAspectRatio',
        Limit: limit
    };

    if (params.type === 'Recordings') {
        query.IsInProgress = false;
    } else {
        query.HasAired = false;
    }

    if (params.genreId) {
        query.GenreIds = params.genreId;
    }

    if (params.IsMovie === 'true') {
        query.IsMovie = true;
    } else if (params.IsMovie === 'false') {
        query.IsMovie = false;
    }

    if (params.IsSeries === 'true') {
        query.IsSeries = true;
    } else if (params.IsSeries === 'false') {
        query.IsSeries = false;
    }

    if (params.IsNews === 'true') {
        query.IsNews = true;
    } else if (params.IsNews === 'false') {
        query.IsNews = false;
    }

    if (params.IsSports === 'true') {
        query.IsSports = true;
    } else if (params.IsSports === 'false') {
        query.IsSports = false;
    }

    if (params.IsKids === 'true') {
        query.IsKids = true;
    } else if (params.IsKids === 'false') {
        query.IsKids = false;
    }

    if (params.IsAiring === 'true') {
        query.IsAiring = true;
    } else if (params.IsAiring === 'false') {
        query.IsAiring = false;
    }

    return modifyQueryWithFilters(instance, query);
}
