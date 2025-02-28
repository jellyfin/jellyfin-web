import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Book from '@mui/icons-material/Book';
import Folder from '@mui/icons-material/Folder';
import LiveTv from '@mui/icons-material/LiveTv';
import Movie from '@mui/icons-material/Movie';
import MusicNote from '@mui/icons-material/MusicNote';
import Photo from '@mui/icons-material/Photo';
import Tv from '@mui/icons-material/Tv';
import React from 'react';

import { GroupType } from './types';

export const getGroupType = (item?: BaseItemDto, overrides?: Record<string, GroupType>) => {
    if (item?.Id && overrides?.[item.Id]) {
        return overrides[item.Id];
    }

    switch (item?.CollectionType) {
        case CollectionType.Books:
            return GroupType.Books;
        case CollectionType.Homevideos:
        case CollectionType.Photos:
            return GroupType.Photos;
        case CollectionType.Livetv:
            return GroupType.LiveTv;
        case CollectionType.Movies:
            return GroupType.Movies;
        case CollectionType.Music:
        case CollectionType.Musicvideos:
            return GroupType.Music;
        case CollectionType.Tvshows:
            return GroupType.TvShows;
    }

    return GroupType.Other;
};

export const getGroupIcon = (group: GroupType) => {
    switch (group) {
        case GroupType.Books:
            return <Book />;
        case GroupType.LiveTv:
            return <LiveTv />;
        case GroupType.Movies:
            return <Movie />;
        case GroupType.Music:
            return <MusicNote />;
        case GroupType.Photos:
            return <Photo />;
        case GroupType.TvShows:
            return <Tv />;
        default:
            return <Folder />;
    }
};

export const getGroupLabel = (group: GroupType) => {
    switch (group) {
        case GroupType.Books:
            return 'Books';
        case GroupType.LiveTv:
            return 'LiveTV';
        case GroupType.Movies:
            return 'Movies';
        case GroupType.Music:
            return 'TabMusic';
        case GroupType.Photos:
            return 'HomeVideosPhotos';
        case GroupType.TvShows:
            return 'Shows';
        default:
            return 'Other';
    }
};
