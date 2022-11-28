import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import Movie from '@mui/icons-material/Movie';
import MusicNote from '@mui/icons-material/MusicNote';
import Photo from '@mui/icons-material/Photo';
import LiveTv from '@mui/icons-material/LiveTv';
import Tv from '@mui/icons-material/Tv';
import Theaters from '@mui/icons-material/Theaters';
import MusicVideo from '@mui/icons-material/MusicVideo';
import Book from '@mui/icons-material/Book';
import Collections from '@mui/icons-material/Collections';
import Queue from '@mui/icons-material/Queue';
import Folder from '@mui/icons-material/Folder';
import React, { FC } from 'react';
import { CollectionType } from 'types/collectionType';

interface LibraryIconProps {
    item: BaseItemDto
}

const LibraryIcon: FC<LibraryIconProps> = ({
    item
}) => {
    switch (item.CollectionType) {
        case CollectionType.Movies:
            return <Movie />;
        case CollectionType.Music:
            return <MusicNote />;
        case CollectionType.HomeVideos:
        case CollectionType.Photos:
            return <Photo />;
        case CollectionType.LiveTv:
            return <LiveTv />;
        case CollectionType.TvShows:
            return <Tv />;
        case CollectionType.Trailers:
            return <Theaters />;
        case CollectionType.MusicVideos:
            return <MusicVideo />;
        case CollectionType.Books:
            return <Book />;
        case CollectionType.BoxSets:
            return <Collections />;
        case CollectionType.Playlists:
            return <Queue />;
        default:
            return <Folder />;
    }
};

export default LibraryIcon;
