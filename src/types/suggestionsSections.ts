import { CardOptions } from './cardOptions';
import { ParametersOptions } from './library';

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
