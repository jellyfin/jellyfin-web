import React, { FC, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';

import globalize from 'lib/globalize';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client';

type SortOption = {
    label: string;
    value: ItemSortBy;
};

type SortOptionsMapping = Record<string, SortOption[]>;

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

const sortOptionsMapping: SortOptionsMapping = {
    [LibraryTab.Movies]: movieOrFavoriteOptions,
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
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'Runtime', value: ItemSortBy.Runtime },
        { label: 'OptionRandom', value: ItemSortBy.Random }
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
    [LibraryTab.Songs]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'Album', value: ItemSortBy.Album },
        { label: 'AlbumArtist', value: ItemSortBy.AlbumArtist },
        { label: 'Artist', value: ItemSortBy.Artist },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime },
        { label: 'OptionRandom', value: ItemSortBy.Random }
    ],
    [LibraryTab.PhotoAlbums]: photosOrPhotoAlbumsOptions,
    [LibraryTab.Photos]: photosOrPhotoAlbumsOptions,
    [LibraryTab.Videos]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'Runtime', value: ItemSortBy.Runtime },
        { label: 'OptionRandom', value: ItemSortBy.Random }
    ]
};

const getSortMenuOptions = (viewType: LibraryTab): SortOption[] => {
    return sortOptionsMapping[viewType] || [];
};

const sortOrderMenuOptions = [
    { label: 'Ascending', value: SortOrder.Ascending },
    { label: 'Descending', value: SortOrder.Descending }
];

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

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const onSelectChange = useCallback(
        (event: SelectChangeEvent) => {
            const name = event.target.name;

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                [name]: event.target.value
            }));
        },
        [setLibraryViewSettings]
    );

    const sortMenuOptions = getSortMenuOptions(viewType);

    return (
        <Box>
            <IconButton
                title={globalize.translate('Sort')}
                sx={{ ml: 2 }}
                aria-describedby={id}
                className='paper-icon-button-light btnSort autoSize'
                onClick={handleClick}
            >
                <SortByAlphaIcon />
            </IconButton>
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
                <FormControl fullWidth>
                    <InputLabel id='select-sort-label'>
                        <Typography component='span'>
                            {globalize.translate('LabelSortBy')}
                        </Typography>
                    </InputLabel>
                    <Select
                        labelId='select-sort-label'
                        id='selectSortBy'
                        value={libraryViewSettings.SortBy}
                        label={globalize.translate('LabelSortBy')}
                        name='SortBy'
                        onChange={onSelectChange}
                    >
                        {sortMenuOptions
                            .map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <Typography component='span'>
                                        {globalize.translate(option.label)}
                                    </Typography>
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>

                <Divider />
                <FormControl fullWidth>
                    <InputLabel id='select-sortorder-label'>
                        <Typography component='span'>
                            {globalize.translate('LabelSortOrder')}
                        </Typography>
                    </InputLabel>
                    <Select
                        labelId='select-sortorder-label'
                        id='selectSortOrder'
                        value={libraryViewSettings.SortOrder}
                        label={globalize.translate('LabelSortOrder')}
                        name='SortOrder'
                        onChange={onSelectChange}
                    >
                        {sortOrderMenuOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                <Typography component='span'>
                                    {option.label}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Popover>
        </Box>
    );
};

export default SortButton;
