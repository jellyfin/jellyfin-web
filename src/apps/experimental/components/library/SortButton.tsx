import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { CaretSortIcon } from '@radix-ui/react-icons';
import globalize from 'lib/globalize';
import React, { type FC, useCallback } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { type LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import {
    Box,
    Button,
    Divider,
    Menu,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Text
} from 'ui-primitives';

interface SortOption {
    label: string;
    value: ItemSortBy;
}

type SortOptionsMapping = Record<string, SortOption[]>;

const collectionMovieOptions: SortOption[] = [
    { label: 'Name', value: ItemSortBy.SortName },
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
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const SortButton: FC<SortButtonProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const onSortByChange = useCallback(
        (value: string) => {
            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                SortBy: value as ItemSortBy
            }));
        },
        [setLibraryViewSettings]
    );

    const onSortOrderChange = useCallback(
        (value: string) => {
            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                SortOrder: value as SortOrder
            }));
        },
        [setLibraryViewSettings]
    );

    const sortMenuOptions = getSortMenuOptions(viewType);

    return (
        <Menu
            id="sort-popover"
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            align="center"
            trigger={
                <Button title={globalize.translate('Sort')} variant="plain">
                    <CaretSortIcon />
                </Button>
            }
        >
            <Box style={{ padding: vars.spacing['4'], width: 220 }}>
                <Text size="sm" weight="medium" color="secondary">
                    {globalize.translate('LabelSortBy')}
                </Text>
                <Select value={libraryViewSettings.SortBy} onValueChange={onSortByChange}>
                    <SelectTrigger style={{ width: '100%', marginTop: vars.spacing['2'] }}>
                        <SelectValue placeholder={globalize.translate('LabelSortBy')} />
                    </SelectTrigger>
                    <SelectContent>
                        {sortMenuOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {globalize.translate(option.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Box>

            <Divider />

            <Box style={{ padding: vars.spacing['4'], width: 220 }}>
                <Text size="sm" weight="medium" color="secondary">
                    {globalize.translate('LabelSortOrder')}
                </Text>
                <Select value={libraryViewSettings.SortOrder} onValueChange={onSortOrderChange}>
                    <SelectTrigger style={{ width: '100%', marginTop: vars.spacing['2'] }}>
                        <SelectValue placeholder={globalize.translate('LabelSortOrder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {sortOrderMenuOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Box>
        </Menu>
    );
};

export default SortButton;
