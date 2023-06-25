import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { CardOptions } from './cardOptions';

interface ParametersOptions {
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder[];
    includeItemTypes?: BaseItemKind[];
}

export enum SectionsViewType {
    ResumeItems = 'resumeItems',
    LatestMedia = 'latestMedia',
    NextUp = 'nextUp',
}

export enum SectionsView {
    ContinueWatchingMovies = 'continuewatchingmovies',
    LatestMovies = 'latestmovies',
    ContinueWatchingEpisode = 'continuewatchingepisode',
    LatestEpisode = 'latestepisode',
    NextUp = 'nextUp',
    LatestMusic = 'latestmusic',
    RecentlyPlayedMusic = 'recentlyplayedmusic',
    FrequentlyPlayedMusic = 'frequentlyplayedmusic',
}

export interface Sections {
    name: string;
    view: SectionsView;
    type: string;
    viewType?: SectionsViewType,
    parametersOptions?: ParametersOptions;
    cardOptions: CardOptions;
}
