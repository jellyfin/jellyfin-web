import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import loading from '../loading/loading';
import * as userSettings from '../../scripts/settings/userSettings';
import AlphaPickerContainer from './AlphaPickerContainer';
import Filter from './Filter';
import ItemsContainer from './ItemsContainer';
import Pagination from './Pagination';
import SelectView from './SelectView';
import Shuffle from './Shuffle';
import Sort from './Sort';
import NewCollection from './NewCollection';
import globalize from '../../scripts/globalize';
import { CardOptions, Query, ViewQuerySettings } from '../../types/interface';
import ServerConnections from '../ServerConnections';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import listview from '../listview/listview';
import cardBuilder from '../cardbuilder/cardBuilder';

interface ViewItemsContainerProps {
    topParentId: string | null;
    isBtnShuffleEnabled?: boolean;
    isBtnSelectViewEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isAlphaPickerEnabled?: boolean;
    getBasekey: () => string;
    getItemTypes: () => string[];
    getNoItemsMessage: () => string;
}

const getDefaultSortBy = () => {
    return 'SortName';
};

const getVisibleViewSettings = () => {
    return [
        'showTitle',
        'showYear',
        'imageType',
        'cardLayout'
    ];
};

const getFilterMenuOptions = () => {
    return {};
};

const getVisibleFilters = () => {
    return [
        'IsUnplayed',
        'IsPlayed',
        'IsFavorite',
        'IsResumable',
        'VideoType',
        'HasSubtitles',
        'HasTrailer',
        'HasSpecialFeature',
        'HasThemeSong',
        'HasThemeVideo'
    ];
};

const getSortMenuOptions = () => {
    return [{
        name: globalize.translate('Name'),
        value: 'SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionRandom'),
        value: 'Random'
    }, {
        name: globalize.translate('OptionImdbRating'),
        value: 'CommunityRating,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionCriticRating'),
        value: 'CriticRating,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionDateAdded'),
        value: 'DateCreated,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionDatePlayed'),
        value: 'DatePlayed,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionParentalRating'),
        value: 'OfficialRating,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionPlayCount'),
        value: 'PlayCount,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionReleaseDate'),
        value: 'PremiereDate,SortName,ProductionYear'
    }, {
        name: globalize.translate('Runtime'),
        value: 'Runtime,SortName,ProductionYear'
    }];
};

const getDefaultViewQuerySettings = (getBasekey: string) => {
    let imageType;
    let showYear;

    if (getBasekey === 'studios') {
        imageType = 'thumb';
        showYear = false;
    } else {
        imageType = 'primary';
    }

    return {
        showTitle: true,
        showYear: showYear,
        imageType: imageType,
        viewType: '',
        cardLayout: false,
        SortBy: getDefaultSortBy(),
        SortOrder: 'Ascending',
        IsPlayed: false,
        IsUnplayed: false,
        IsFavorite: false,
        IsResumable: false,
        Is4K: null,
        IsHD: null,
        IsSD: null,
        Is3D: null,
        VideoTypes: '',
        SeriesStatus: '',
        HasSubtitles: null,
        HasTrailer: null,
        HasSpecialFeature: null,
        HasThemeSong: null,
        HasThemeVideo: null,
        GenreIds: '',
        StartIndex: 0
    };
};

const ViewItemsContainer: FC<ViewItemsContainerProps> = ({
    topParentId,
    isBtnShuffleEnabled = false,
    isBtnSelectViewEnabled = true,
    isBtnSortEnabled = true,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    isAlphaPickerEnabled = true,
    getBasekey,
    getItemTypes,
    getNoItemsMessage
}) => {
    const getSettingsKey = useCallback(() => {
        return `${topParentId} - ${getBasekey()}`;
    }, [getBasekey, topParentId]);

    const [isLoading, setisLoading] = useState(false);

    const [viewQuerySettings, setViewQuerySettings] = useLocalStorage<ViewQuerySettings>(
        `viewQuerySettings - ${getSettingsKey()}`,
        {
            ...getDefaultViewQuerySettings(getBasekey())
        }
    );

    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>({});

    const element = useRef<HTMLDivElement>(null);

    const getContext = useCallback(() => {
        const itemType = getItemTypes().join(',');
        if (itemType === 'Movie' || itemType === 'BoxSet') {
            return 'movies';
        }

        if (itemType === 'Series' || itemType === 'Season' || itemType === 'Episode') {
            return 'tvshows';
        }

        return null;
    }, [getItemTypes]);

    const getCardOptions = useCallback(() => {
        let shape;
        let preferThumb;
        let preferDisc;
        let preferLogo;

        if (viewQuerySettings.imageType === 'banner') {
            shape = 'banner';
        } else if (viewQuerySettings.imageType === 'disc') {
            shape = 'square';
            preferDisc = true;
        } else if (viewQuerySettings.imageType === 'logo') {
            shape = 'backdrop';
            preferLogo = true;
        } else if (viewQuerySettings.imageType === 'thumb') {
            shape = 'backdrop';
            preferThumb = true;
        } else {
            shape = 'autoVertical';
        }

        const cardOptions: CardOptions = {
            shape: shape,
            showTitle: viewQuerySettings.showTitle,
            showYear: viewQuerySettings.showYear,
            cardLayout: viewQuerySettings.cardLayout,
            centerText: true,
            context: getContext(),
            coverImage: true,
            preferThumb: preferThumb,
            preferDisc: preferDisc,
            preferLogo: preferLogo,
            overlayPlayButton: false,
            overlayMoreButton: true,
            overlayText: !viewQuerySettings.showTitle
        };

        if (getBasekey() === 'episodes') {
            cardOptions.showParentTitle = viewQuerySettings.showTitle;
        }

        cardOptions.items = itemsResult.Items || [];

        return cardOptions;
    }, [
        getBasekey,
        getContext,
        itemsResult.Items,
        viewQuerySettings.cardLayout,
        viewQuerySettings.imageType,
        viewQuerySettings.showTitle,
        viewQuerySettings.showYear
    ]);

    const getItemsHtml = useCallback(() => {
        let html = '';

        if (viewQuerySettings.imageType === 'list') {
            html = listview.getListViewHtml({
                items: itemsResult.Items || [],
                context: getContext()
            });
        } else {
            html = cardBuilder.getCardsHtml(itemsResult.Items || [], getCardOptions());
        }

        if (!itemsResult.Items?.length) {
            html += '<div class="noItemsMessage centerMessage">';
            html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
            html += '<p>' + globalize.translate(getNoItemsMessage()) + '</p>';
            html += '</div>';
        }

        return html;
    }, [getCardOptions, getContext, itemsResult.Items, getNoItemsMessage, viewQuerySettings.imageType]);

    const getFields = useCallback(() => {
        const fields = [];

        if (getBasekey() !== 'studios') {
            fields.push('BasicSyncInfo', 'MediaSourceCount');
        }

        if (viewQuerySettings.imageType === 'primary') {
            fields.push('PrimaryImageAspectRatio');
        }

        if (getBasekey() === 'studios') {
            fields.push('DateCreated', 'PrimaryImageAspectRatio');
        }

        if (viewQuerySettings.showYear) {
            fields.push('ProductionYear');
        }
        return fields.join(',');
    }, [getBasekey, viewQuerySettings.imageType, viewQuerySettings.showYear]);

    const getFilters = useCallback(() => {
        const filters = [];

        if (viewQuerySettings.IsPlayed) {
            filters.push('IsPlayed');
        }

        if (viewQuerySettings.IsUnplayed) {
            filters.push('IsUnplayed');
        }

        if (viewQuerySettings.IsFavorite) {
            filters.push('IsFavorite');
        }

        if (viewQuerySettings.IsResumable) {
            filters.push('IsResumable');
        }

        return filters.length ? filters.join(',') : null;
    }, [viewQuerySettings.IsFavorite, viewQuerySettings.IsPlayed, viewQuerySettings.IsResumable, viewQuerySettings.IsUnplayed]);

    const getQuery = useCallback(() => {
        let queryIsHD;

        if (viewQuerySettings.IsHD) {
            queryIsHD = true;
        }

        if (viewQuerySettings.IsSD) {
            queryIsHD = false;
        }

        const query: Query = {
            SortBy: viewQuerySettings.SortBy,
            SortOrder: viewQuerySettings.SortOrder,
            IncludeItemTypes: getItemTypes().join(','),
            Recursive: true,
            Fields: getFields(),
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb,Disc,Logo',
            Limit: userSettings.libraryPageSize(undefined),
            IsFavorite: getBasekey() === 'favorites' ? true : null,
            VideoTypes: viewQuerySettings.VideoTypes,
            GenreIds: viewQuerySettings.GenreIds,
            Is4K: viewQuerySettings.Is4K ? true : null,
            IsHD: queryIsHD,
            Is3D: viewQuerySettings.Is3D ? true : null,
            HasSubtitles: viewQuerySettings.HasSubtitles ? true : null,
            HasTrailer: viewQuerySettings.HasTrailer ? true : null,
            HasSpecialFeature: viewQuerySettings.HasSpecialFeature ? true : null,
            HasThemeSong: viewQuerySettings.HasThemeSong ? true : null,
            HasThemeVideo: viewQuerySettings.HasThemeVideo ? true : null,
            Filters: getFilters(),
            StartIndex: viewQuerySettings.StartIndex,
            NameLessThan: viewQuerySettings.NameLessThan,
            NameStartsWith: viewQuerySettings.NameStartsWith,
            ParentId: topParentId
        };

        if (getBasekey() === 'episodes') {
            query.IsMissing = false;
        }

        return query;
    }, [
        getBasekey,
        getFields,
        getFilters,
        getItemTypes,
        topParentId,
        viewQuerySettings.GenreIds,
        viewQuerySettings.HasSpecialFeature,
        viewQuerySettings.HasSubtitles,
        viewQuerySettings.HasThemeSong,
        viewQuerySettings.HasThemeVideo,
        viewQuerySettings.HasTrailer,
        viewQuerySettings.Is3D,
        viewQuerySettings.Is4K,
        viewQuerySettings.IsHD,
        viewQuerySettings.IsSD,
        viewQuerySettings.NameLessThan,
        viewQuerySettings.NameStartsWith,
        viewQuerySettings.SortBy,
        viewQuerySettings.SortOrder,
        viewQuerySettings.StartIndex,
        viewQuerySettings.VideoTypes
    ]);

    const fetchData = useCallback(() => {
        loading.show();
        const apiClient = ServerConnections.getApiClient(window.ApiClient.serverId());

        if (getBasekey() === 'studios') {
            return apiClient.getStudios(
                apiClient.getCurrentUserId(),
                {
                    ...getQuery()
                }
            );
        }

        return apiClient.getItems(
            apiClient.getCurrentUserId(),
            {
                ...getQuery()
            }
        );
    }, [getBasekey, getQuery]);

    const reloadItems = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        setisLoading(false);
        fetchData().then((result) => {
            setItemsResult(result);

            window.scrollTo(0, 0);

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(page);
            });
            loading.hide();
            setisLoading(true);
        });
    }, [fetchData]);

    useEffect(() => {
        reloadItems();
    }, [reloadItems]);

    return (
        <div ref={element}>
            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    itemsResult= {itemsResult}
                    viewQuerySettings={viewQuerySettings}
                    setViewQuerySettings={setViewQuerySettings}
                />

                {isBtnShuffleEnabled && <Shuffle itemsResult={itemsResult} topParentId={topParentId} />}

                {isBtnSelectViewEnabled && <SelectView
                    getVisibleViewSettings={getVisibleViewSettings}
                    viewQuerySettings={viewQuerySettings}
                    setViewQuerySettings={setViewQuerySettings}
                />}

                {isBtnSortEnabled && <Sort
                    getSortMenuOptions={getSortMenuOptions}
                    viewQuerySettings={viewQuerySettings}
                    setViewQuerySettings={setViewQuerySettings}
                />}

                {isBtnFilterEnabled && <Filter
                    topParentId={topParentId}
                    getItemTypes={getItemTypes}
                    getVisibleFilters={getVisibleFilters}
                    getFilterMenuOptions={getFilterMenuOptions}
                    viewQuerySettings={viewQuerySettings}
                    setViewQuerySettings={setViewQuerySettings}
                />}

                {isBtnNewCollectionEnabled && <NewCollection />}

            </div>

            {isAlphaPickerEnabled && <AlphaPickerContainer
                viewQuerySettings={viewQuerySettings}
                setViewQuerySettings={setViewQuerySettings}
            />}

            {isLoading && <ItemsContainer
                viewQuerySettings={viewQuerySettings}
                getItemsHtml={getItemsHtml}
            />}

            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    itemsResult= {itemsResult}
                    viewQuerySettings={viewQuerySettings}
                    setViewQuerySettings={setViewQuerySettings}
                />
            </div>
        </div>
    );
};

export default ViewItemsContainer;
