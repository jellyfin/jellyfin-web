import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

export enum GroupType {
    Books = 'Books',
    LiveTv = 'LiveTv',
    Movies = 'Movies',
    Music = 'Music',
    Other = 'Other',
    Photos = 'Photos',
    TvShows = 'TvShows'
}

export interface ViewGroup {
    type: GroupType
    icon: React.ReactNode
    views: BaseItemDto[]
}
