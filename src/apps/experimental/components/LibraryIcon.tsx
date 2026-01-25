import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import {
    ArchiveIcon,
    DesktopIcon,
    DiscIcon,
    FileIcon,
    HeartFilledIcon,
    ImageIcon,
    QuestionMarkCircledIcon,
    ReaderIcon,
    StackIcon,
    VideoIcon
} from '@radix-ui/react-icons';
import React, { type FC } from 'react';

import { MetaView } from '../constants/metaView';

interface LibraryIconProps {
    item: BaseItemDto;
}

const LibraryIcon: FC<LibraryIconProps> = ({ item }) => {
    if (item.Id === MetaView.Favorites.Id) {
        return <HeartFilledIcon />;
    }

    switch (item.CollectionType) {
        case CollectionType.Movies:
            return <VideoIcon />;
        case CollectionType.Music:
            return <DiscIcon />;
        case CollectionType.Homevideos:
        case CollectionType.Photos:
            return <ImageIcon />;
        case CollectionType.Livetv:
            return <DesktopIcon />;
        case CollectionType.Tvshows:
            return <DesktopIcon />;
        case CollectionType.Trailers:
            return <VideoIcon />;
        case CollectionType.Musicvideos:
            return <VideoIcon />;
        case CollectionType.Books:
            return <ReaderIcon />;
        case CollectionType.Boxsets:
            return <ArchiveIcon />;
        case CollectionType.Playlists:
            return <StackIcon />;
        case undefined:
            return <QuestionMarkCircledIcon />;
        default:
            return <FileIcon />;
    }
};

export default LibraryIcon;
