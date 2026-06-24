import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import React, { FC, useCallback } from 'react';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';

import globalize from 'lib/globalize';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

type SortOption = {
    label: string;
    value: ItemSortBy;
};

type SortOptionsMapping = Record<string, SortOption[]>;

const collectionMovieOptions: SortOption[] = [
    { label: 'Name', value: ItemSortBy.SortName },
    { label: 'OptionRandom', value: ItemSortBy.Random },
    { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
    { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
    { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
    { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate }
];

const movieOrFavoriteOptions = [
    { label: 'Name', value: ItemSortBy.SortName },
    { label: 'OptionRandom', value: ItemSortBy.Random },
    { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
    { label: 'OptionCriticRating', value: ItemSortBy.CriticRating },
    { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
    { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
    { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
    { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
    { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
    { label: 'Runtime', value: ItemSortBy.Runtime }
];

const photosOrPhotoAlbumsOptions = [
    { label: 'Name', value: ItemSortBy.SortName },
    { label: 'OptionRandom', value: ItemSortBy.Random },
    { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
];

const videoOrMusicVideoOptions = [
    { label: 'Name', value: ItemSortBy.SortName },
    { label: 'OptionRandom', value: ItemSortBy.Random },
    { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
    { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
    { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
    { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
    { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
    { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
    { label: 'Runtime', value: ItemSortBy.Runtime }
];

const sortOptionsMapping: SortOptionsMapping = {
    [LibraryTab.Movies]: movieOrFavoriteOptions,
    [LibraryTab.Collections]: collectionMovieOptions,
    [LibraryTab.Favorites]: movieOrFavoriteOptions,
    [LibraryTab.Series]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionDateShowAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDateEpisodeAdded', value: ItemSortBy.DateLastContentAdded },
        { label: 'OptionDatePlayed', value: ItemSortBy.SeriesDatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate }
    ],
    [LibraryTab.Episodes]: [
        { label: 'Name', value: ItemSortBy.SeriesSortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'Runtime', value: ItemSortBy.Runtime }
    ],
    [LibraryTab.Albums]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'AlbumArtist', value: ItemSortBy.AlbumArtist },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionCriticRating', value: ItemSortBy.CriticRating },
        { label: 'OptionReleaseDate', value: ItemSortBy.ProductionYear },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
    ],
    [LibraryTab.Books]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionReleaseDate', value: ItemSortBy.ProductionYear },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed }
    ],
    [LibraryTab.Songs]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'Album', value: ItemSortBy.Album },
        { label: 'AlbumArtist', value: ItemSortBy.AlbumArtist },
        { label: 'Artist', value: ItemSortBy.Artist },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime }
    ],
    [LibraryTab.Playlists]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlaylistUpdated', value: ItemSortBy.DateLastContentAdded },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime }
    ],
    [LibraryTab.PhotoAlbums]: photosOrPhotoAlbumsOptions,
    [LibraryTab.Photos]: photosOrPhotoAlbumsOptions,
    [LibraryTab.Videos]:videoOrMusicVideoOptions,
    [LibraryTab.MusicVideos]:videoOrMusicVideoOptions,
    [LibraryTab.Folders]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'Folders', value: ItemSortBy.IsFolder },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime }
    ],
    [LibraryTab.Mixed]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionCriticRating', value: ItemSortBy.CriticRating },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDateEpisodeAdded', value: ItemSortBy.DateLastContentAdded },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime }
    ]
};

const getSortMenuOptions = (viewType: LibraryTab): SortOption[] => {
    return sortOptionsMapping[viewType] || [];
};

interface SortButtonProps {
    viewType: LibraryTab;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const SortButton: FC<SortButtonProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const id = open ? 'sort-popover' : undefined;
    const sortMenuOptions = getSortMenuOptions(viewType);

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const onMenuItemClick = useCallback(
        (sortBy: ItemSortBy) => {
            setLibraryViewSettings((prevState) => {
                let sortOrder: SortOrder = SortOrder.Ascending;
                // If the user clicks the currently selected sort option, toggle the sort order
                if (prevState.SortBy === sortBy) {
                    sortOrder = prevState.SortOrder === SortOrder.Ascending ? SortOrder.Descending : SortOrder.Ascending;
                }

                return {
                    ...prevState,
                    StartIndex: 0,
                    SortBy: sortBy,
                    SortOrder: sortOrder
                };
            });
        },
        [setLibraryViewSettings]
    );

    return (
        <>
            <Button
                title={globalize.translate('Sort')}
                aria-describedby={id}
                onClick={handleClick}
            >
                <SortByAlphaIcon />
            </Button>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                sx={{
                    '& .MuiFormControl-root': { m: 1, width: 200 }
                }}
            >
                <MenuList>
                    {sortMenuOptions
                        .map((option) => (
                            <MenuItem
                                key={option.value}
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={() => onMenuItemClick(option.value)}
                            >
                                <ListItemText>
                                    {globalize.translate(option.label)}
                                </ListItemText>
                                <ListItemIcon sx={{ justifyContent: 'flex-end' }}>
                                    {libraryViewSettings.SortBy === option.value && (
                                        libraryViewSettings.SortOrder === SortOrder.Ascending ? (
                                            <ArrowUpward fontSize='small' />
                                        ) : (
                                            <ArrowDownward fontSize='small' />
                                        ))
                                    }
                                </ListItemIcon>
                            </MenuItem>
                        ))}
                </MenuList>
            </Popover>
        </>
    );
};

export default SortButton;
