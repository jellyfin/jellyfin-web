import React, {
    createContext,
    FC,
    useContext,
    useMemo,
    useState
} from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { LibraryViewSelectOptions, LibraryViewSettings, ParentId, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import { Box } from '@mui/material';
import Page from 'components/Page';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { BaseItemDto, ImageType, SortOrder } from '@jellyfin/sdk/lib/generated-client';
import { CollectionType } from 'types/collectionType';

const getLibraryViewMenuOptions = (collectionType: CollectionType) => {
    const viewSelectOptions: LibraryViewSelectOptions[] = [];
    if (collectionType === CollectionType.Movies) {
        viewSelectOptions.push(
            { title: 'Movies', value: LibraryTab.Movies },
            { title: 'Trailers', value: LibraryTab.Trailers },
            { title: 'Collections', value: LibraryTab.Collections },
            { title: 'Genres', value: LibraryTab.Genres },
            { title: 'Studios', value: LibraryTab.Networks },
            { title: 'Suggestions', value: LibraryTab.Suggestions }
        );
    }

    if (collectionType === CollectionType.TvShows) {
        viewSelectOptions.push(
            { title: 'Series', value: LibraryTab.Series },
            { title: 'Episodes', value: LibraryTab.Episodes },
            { title: 'Genres', value: LibraryTab.Genres },
            { title: 'Studios', value: LibraryTab.Networks },
            { title: 'TabUpcoming', value: LibraryTab.Upcoming },
            { title: 'Suggestions', value: LibraryTab.Suggestions }
        );
    }

    if (collectionType === CollectionType.Music) {
        viewSelectOptions.push(
            { title: 'Albums', value: LibraryTab.Albums },
            { title: 'HeaderAlbumArtists', value: LibraryTab.AlbumArtists },
            { title: 'Artists', value: LibraryTab.Artists },
            { title: 'Playlists', value: LibraryTab.Playlists },
            { title: 'Genres', value: LibraryTab.Genres },
            { title: 'Songs', value: LibraryTab.Songs },
            { title: 'Suggestions', value: LibraryTab.Suggestions }
        );
    }

    if (collectionType === CollectionType.Books) {
        viewSelectOptions.push({ title: 'Books', value: LibraryTab.Books });
    }

    if (collectionType === CollectionType.LiveTv) {
        viewSelectOptions.push({
            title: 'Channels',
            value: LibraryTab.Channels
        });
    }

    if (collectionType === CollectionType.HomeVideos) {
        viewSelectOptions.push(
            { title: 'HeaderPhotoAlbums', value: LibraryTab.PhotoAlbums },
            { title: 'Photos', value: LibraryTab.Photos },
            { title: 'HeaderVideos', value: LibraryTab.Videos }
        );
    }

    return viewSelectOptions;
};

const getBackDropType = (collectionType: CollectionType) => {
    if (collectionType === CollectionType.Movies) {
        return 'movie';
    }

    if (collectionType === CollectionType.TvShows) {
        return 'series';
    }

    if (collectionType === CollectionType.Music) {
        return 'musicartist';
    }

    if (collectionType === CollectionType.Books) {
        return 'book';
    }

    if (collectionType === CollectionType.HomeVideos) {
        return 'video, photo';
    }

    return '';
};
export interface LibrarySettingsContextProps {
    item: BaseItemDto | undefined;
    viewSelectOptions: LibraryViewSelectOptions[];
    viewType: LibraryTab;
    setViewType: React.Dispatch<React.SetStateAction<LibraryTab>>;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const LibrarySettingsContext = createContext<LibrarySettingsContextProps>(
    {} as LibrarySettingsContextProps
);

export const useLibrarySettings = () => useContext(LibrarySettingsContext);

const getSettingsKey = (viewType: LibraryTab, parentId: ParentId) => {
    return `${viewType} - ${parentId}`;
};

const DEFAULT_Library_View_SETTINGS: LibraryViewSettings = {
    SortBy: ItemSortBy.SortName,
    SortOrder: SortOrder.Ascending,
    StartIndex: 0,
    CardLayout: false,
    ImageType: ImageType.Primary,
    ViewMode: ViewMode.GridView,
    ShowTitle: true,
    ShowYear: false
};

interface LibrarySettingsProviderProps {
    item: BaseItemDto | undefined;
    parentId?: string | null;
    defaultView: LibraryTab;
    collectionType?: CollectionType;
}

export const LibrarySettingsProvider: FC<LibrarySettingsProviderProps> = ({
    item,
    defaultView,
    children
}) => {
    const viewSelectOptions = getLibraryViewMenuOptions(item?.CollectionType as CollectionType);
    const [viewType, setViewType] = useState<LibraryTab>(
        defaultView ?? viewSelectOptions[0].value
    );
    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorageState<LibraryViewSettings>(
            getSettingsKey(viewType, item?.Id),
            {
                defaultValue: DEFAULT_Library_View_SETTINGS
            }
        );

    const context = useMemo(
        () => ({
            item,
            viewSelectOptions,
            viewType,
            setViewType,
            libraryViewSettings,
            setLibraryViewSettings
        }),
        [
            item,
            viewSelectOptions,
            viewType,
            libraryViewSettings,
            setLibraryViewSettings
        ]
    );

    return (
        <LibrarySettingsContext.Provider value={context}>
            <Page
                id='libraryPage'
                className='mainAnimatedPage libraryPage backdropPage'
                backDropType={getBackDropType(item?.CollectionType as CollectionType)}
            >
                <Box>{children}</Box>
            </Page>
        </LibrarySettingsContext.Provider>
    );
};
