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
    value: ItemSortBy[];
};

type SortOptionsMapping = Record<string, SortOption[]>;

const collectionMovieOptions: SortOption[] = [
    { label: 'Name', value: [ItemSortBy.SortName] },
    { label: 'OptionRandom', value: [ItemSortBy.Random] },
    { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
    { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
    { label: 'OptionParentalRating', value: [ItemSortBy.OfficialRating, ItemSortBy.SortName] },
    { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] }
];

const movieOrFavoriteOptions = [
    { label: 'Name', value: [ItemSortBy.SortName] },
    { label: 'OptionRandom', value: [ItemSortBy.Random] },
    { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
    { label: 'OptionCriticRating', value: [ItemSortBy.CriticRating, ItemSortBy.SortName] },
    { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
    { label: 'OptionDatePlayed', value: [ItemSortBy.DatePlayed, ItemSortBy.SortName] },
    { label: 'OptionParentalRating', value: [ItemSortBy.OfficialRating, ItemSortBy.SortName] },
    { label: 'OptionPlayCount', value: [ItemSortBy.PlayCount, ItemSortBy.SortName] },
    { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
    { label: 'Runtime', value: [ItemSortBy.Runtime, ItemSortBy.SortName] }
];

const photosOrPhotoAlbumsOptions = [
    { label: 'Name', value: [ItemSortBy.SortName] },
    { label: 'OptionRandom', value: [ItemSortBy.Random] },
    { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] }
];

const videoOrMusicVideoOptions = [
    { label: 'Name', value: [ItemSortBy.SortName] },
    { label: 'OptionRandom', value: [ItemSortBy.Random] },
    { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
    { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
    { label: 'OptionDatePlayed', value: [ItemSortBy.DatePlayed, ItemSortBy.SortName] },
    { label: 'OptionParentalRating', value: [ItemSortBy.OfficialRating, ItemSortBy.SortName] },
    { label: 'OptionPlayCount', value: [ItemSortBy.PlayCount, ItemSortBy.SortName] },
    { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
    { label: 'Runtime', value: [ItemSortBy.Runtime, ItemSortBy.SortName] }
];

const sortOptionsMapping: SortOptionsMapping = {
    [LibraryTab.Movies]: movieOrFavoriteOptions,
    [LibraryTab.Collections]: collectionMovieOptions,
    [LibraryTab.Favorites]: movieOrFavoriteOptions,
    [LibraryTab.Series]: [
        { label: 'Name', value: [ItemSortBy.SortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
        { label: 'OptionDateShowAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
        { label: 'OptionDateEpisodeAdded', value: [ItemSortBy.DateLastContentAdded, ItemSortBy.SortName] },
        { label: 'OptionDatePlayed', value: [ItemSortBy.SeriesDatePlayed, ItemSortBy.SortName] },
        { label: 'OptionParentalRating', value: [ItemSortBy.OfficialRating, ItemSortBy.SortName] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] }
    ],
    [LibraryTab.Episodes]: [
        { label: 'Name', value: [ItemSortBy.SeriesSortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
        { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
        { label: 'OptionDatePlayed', value: [ItemSortBy.DatePlayed, ItemSortBy.SortName] },
        { label: 'OptionParentalRating', value: [ItemSortBy.OfficialRating, ItemSortBy.SortName] },
        { label: 'OptionPlayCount', value: [ItemSortBy.PlayCount, ItemSortBy.SortName] },
        { label: 'Runtime', value: [ItemSortBy.Runtime, ItemSortBy.SortName] }
    ],
    [LibraryTab.Albums]: [
        { label: 'Name', value: [ItemSortBy.SortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'AlbumArtist', value: [ItemSortBy.AlbumArtist, ItemSortBy.SortName] },
        { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
        { label: 'OptionCriticRating', value: [ItemSortBy.CriticRating, ItemSortBy.SortName] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
        { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] }
    ],
    [LibraryTab.Books]: [
        { label: 'Name', value: [ItemSortBy.SortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
        { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
        { label: 'OptionDatePlayed', value: [ItemSortBy.DatePlayed, ItemSortBy.SortName] },
        { label: 'IndexNumber', value: [ItemSortBy.IndexNumber, ItemSortBy.SortName] }
    ],
    [LibraryTab.Songs]: [
        { label: 'Name', value: [ItemSortBy.SortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'Album', value: [ItemSortBy.Album, ItemSortBy.SortName] },
        { label: 'AlbumArtist', value: [ItemSortBy.AlbumArtist, ItemSortBy.SortName] },
        { label: 'Artist', value: [ItemSortBy.Artist, ItemSortBy.SortName] },
        { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
        { label: 'OptionDatePlayed', value: [ItemSortBy.DatePlayed, ItemSortBy.SortName] },
        { label: 'OptionPlayCount', value: [ItemSortBy.PlayCount, ItemSortBy.SortName] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
        { label: 'Runtime', value: [ItemSortBy.Runtime, ItemSortBy.SortName] }
    ],
    [LibraryTab.Playlists]: [
        { label: 'Name', value: [ItemSortBy.SortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
        { label: 'OptionDatePlaylistUpdated', value: [ItemSortBy.DateLastContentAdded, ItemSortBy.SortName] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
        { label: 'Runtime', value: [ItemSortBy.Runtime, ItemSortBy.SortName] }
    ],
    [LibraryTab.PhotoAlbums]: photosOrPhotoAlbumsOptions,
    [LibraryTab.Photos]: photosOrPhotoAlbumsOptions,
    [LibraryTab.Videos]:videoOrMusicVideoOptions,
    [LibraryTab.MusicVideos]:videoOrMusicVideoOptions,
    [LibraryTab.Folders]: [
        { label: 'Name', value: [ItemSortBy.SortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
        { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
        { label: 'OptionDatePlayed', value: [ItemSortBy.DatePlayed, ItemSortBy.SortName] },
        { label: 'Folders', value: [ItemSortBy.IsFolder, ItemSortBy.SortName] },
        { label: 'OptionParentalRating', value: [ItemSortBy.OfficialRating, ItemSortBy.SortName] },
        { label: 'OptionPlayCount', value: [ItemSortBy.PlayCount, ItemSortBy.SortName] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
        { label: 'Runtime', value: [ItemSortBy.Runtime, ItemSortBy.SortName] }
    ],
    [LibraryTab.Mixed]: [
        { label: 'Name', value: [ItemSortBy.SortName] },
        { label: 'OptionRandom', value: [ItemSortBy.Random] },
        { label: 'OptionCommunityRating', value: [ItemSortBy.CommunityRating, ItemSortBy.SortName] },
        { label: 'OptionCriticRating', value: [ItemSortBy.CriticRating, ItemSortBy.SortName] },
        { label: 'OptionDateAdded', value: [ItemSortBy.DateCreated, ItemSortBy.SortName] },
        { label: 'OptionDateEpisodeAdded', value: [ItemSortBy.DateLastContentAdded, ItemSortBy.SortName] },
        { label: 'OptionDatePlayed', value: [ItemSortBy.DatePlayed, ItemSortBy.SortName] },
        { label: 'OptionParentalRating', value: [ItemSortBy.OfficialRating, ItemSortBy.SortName] },
        { label: 'OptionPlayCount', value: [ItemSortBy.PlayCount, ItemSortBy.SortName] },
        { label: 'OptionReleaseDate', value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName] },
        { label: 'Runtime', value: [ItemSortBy.Runtime, ItemSortBy.SortName] }
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
        (sortBy: ItemSortBy[]) => {
            setLibraryViewSettings((prevState) => {
                let sortOrder: SortOrder = SortOrder.Ascending;
                // If the user clicks the currently selected sort option, toggle the sort order
                if (prevState.SortBy[0] === sortBy[0]) {
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
                                key={option.value.join(',')}
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={() => onMenuItemClick(option.value)}
                            >
                                <ListItemText>
                                    {globalize.translate(option.label)}
                                </ListItemText>
                                <ListItemIcon sx={{ justifyContent: 'flex-end' }}>
                                    {libraryViewSettings.SortBy[0] === option.value[0] && (
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
