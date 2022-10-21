import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import loading from '../../components/loading/loading';
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
import { CardOptionsI, QueryI, ViewSettingsI } from './interface';
import ServerConnections from '../../components/ServerConnections';
import { useLocalStorage } from '../hook/useLocalStorage';
import listview from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';

interface ViewItemsContainerProps {
    topParentId: string | null;
    isBtnShuffleEnabled?: boolean;
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

const defaultViewSettingsValue: ViewSettingsI = {
    showTitle: true,
    showYear: true,
    imageType: 'primary',
    viewType: '',
    cardLayout: true,
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

const ViewItemsContainer: FC<ViewItemsContainerProps> = ({
    topParentId,
    isBtnShuffleEnabled = false,
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

    const [viewSettings, setViewSettings] = useLocalStorage<ViewSettingsI>(
        `viewSettings - ${getSettingsKey()}`,
        defaultViewSettingsValue
    );

    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>({});

    const element = useRef<HTMLDivElement>(null);

    const getContext = useCallback(() => {
        const itemType = getItemTypes().join(',');
        if (itemType === 'Movie' || itemType === 'BoxSet') {
            return 'movies';
        }

        return null;
    }, [getItemTypes]);

    const getCardOptions = useCallback(() => {
        let shape;
        let preferThumb;
        let preferDisc;
        let preferLogo;

        if (viewSettings.imageType === 'banner') {
            shape = 'banner';
        } else if (viewSettings.imageType === 'disc') {
            shape = 'square';
            preferDisc = true;
        } else if (viewSettings.imageType === 'logo') {
            shape = 'backdrop';
            preferLogo = true;
        } else if (viewSettings.imageType === 'thumb') {
            shape = 'backdrop';
            preferThumb = true;
        } else {
            shape = 'autoVertical';
        }

        const cardOptions: CardOptionsI = {
            shape: shape,
            showTitle: viewSettings.showTitle,
            showYear: viewSettings.showYear,
            cardLayout: viewSettings.cardLayout,
            centerText: true,
            context: getContext(),
            coverImage: true,
            preferThumb: preferThumb,
            preferDisc: preferDisc,
            preferLogo: preferLogo,
            overlayPlayButton: false,
            overlayMoreButton: true,
            overlayText: !viewSettings.showTitle
        };

        cardOptions.items = itemsResult.Items || [];

        return cardOptions;
    }, [getContext, itemsResult.Items, viewSettings.cardLayout, viewSettings.imageType, viewSettings.showTitle, viewSettings.showYear]);

    const getItemsHtml = useCallback(() => {
        let html = '';

        if (viewSettings.imageType === 'list') {
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
    }, [getCardOptions, getContext, itemsResult.Items, getNoItemsMessage, viewSettings.imageType]);

    const getQuery = useCallback(() => {
        let fields = 'BasicSyncInfo,MediaSourceCount';

        if (viewSettings.imageType === 'primary') {
            fields += ',PrimaryImageAspectRatio';
        }

        if (viewSettings.showYear) {
            fields += ',ProductionYear';
        }

        const queryFilters: string[] = [];

        if (viewSettings.IsPlayed) {
            queryFilters.push('IsPlayed');
        }

        if (viewSettings.IsUnplayed) {
            queryFilters.push('IsUnplayed');
        }

        if (viewSettings.IsFavorite) {
            queryFilters.push('IsFavorite');
        }

        if (viewSettings.IsResumable) {
            queryFilters.push('IsResumable');
        }

        let queryIsHD;

        if (viewSettings.IsHD) {
            queryIsHD = true;
        }

        if (viewSettings.IsSD) {
            queryIsHD = false;
        }

        const options: QueryI = {
            SortBy: viewSettings.SortBy,
            SortOrder: viewSettings.SortOrder,
            IncludeItemTypes: getItemTypes().join(','),
            Recursive: true,
            Fields: fields,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb,Disc,Logo',
            Limit: userSettings.libraryPageSize(undefined),
            IsFavorite: getBasekey() === 'favorites' ? true : null,
            VideoTypes: viewSettings.VideoTypes,
            GenreIds: viewSettings.GenreIds,
            Is4K: viewSettings.Is4K ? true : null,
            IsHD: queryIsHD,
            Is3D: viewSettings.Is3D ? true : null,
            HasSubtitles: viewSettings.HasSubtitles ? true : null,
            HasTrailer: viewSettings.HasTrailer ? true : null,
            HasSpecialFeature: viewSettings.HasSpecialFeature ? true : null,
            HasThemeSong: viewSettings.HasThemeSong ? true : null,
            HasThemeVideo: viewSettings.HasThemeVideo ? true : null,
            Filters: queryFilters.length ? queryFilters.join(',') : null,
            StartIndex: viewSettings.StartIndex,
            NameLessThan: viewSettings.NameLessThan,
            NameStartsWith: viewSettings.NameStartsWith,
            ParentId: topParentId
        };

        return options;
    }, [viewSettings.imageType, viewSettings.showYear, viewSettings.IsPlayed, viewSettings.IsUnplayed, viewSettings.IsFavorite, viewSettings.IsResumable, viewSettings.IsHD, viewSettings.IsSD, viewSettings.SortBy, viewSettings.SortOrder, viewSettings.VideoTypes, viewSettings.GenreIds, viewSettings.Is4K, viewSettings.Is3D, viewSettings.HasSubtitles, viewSettings.HasTrailer, viewSettings.HasSpecialFeature, viewSettings.HasThemeSong, viewSettings.HasThemeVideo, viewSettings.StartIndex, viewSettings.NameLessThan, viewSettings.NameStartsWith, getItemTypes, getBasekey, topParentId]);

    const fetchData = useCallback(() => {
        loading.show();

        const apiClient = ServerConnections.getApiClient(window.ApiClient.serverId());
        return apiClient.getItems(
            apiClient.getCurrentUserId(),
            {
                ...getQuery()
            }
        );
    }, [getQuery]);

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
                    viewSettings={viewSettings}
                    setViewSettings={setViewSettings}
                />

                {isBtnShuffleEnabled && <Shuffle itemsResult={itemsResult} topParentId={topParentId} />}

                <SelectView
                    getVisibleViewSettings={getVisibleViewSettings}
                    viewSettings={viewSettings}
                    setViewSettings={setViewSettings}
                />

                <Sort
                    getSortMenuOptions={getSortMenuOptions}
                    viewSettings={viewSettings}
                    setViewSettings={setViewSettings}
                />

                {isBtnFilterEnabled && <Filter
                    topParentId={topParentId}
                    getItemTypes={getItemTypes}
                    getVisibleFilters={getVisibleFilters}
                    getFilterMenuOptions={getFilterMenuOptions}
                    viewSettings={viewSettings}
                    setViewSettings={setViewSettings}
                />}

                {isBtnNewCollectionEnabled && <NewCollection />}

            </div>

            {isAlphaPickerEnabled && <AlphaPickerContainer
                viewSettings={viewSettings}
                setViewSettings={setViewSettings}
            />}

            {isLoading && <ItemsContainer
                viewSettings={viewSettings}
                getItemsHtml={getItemsHtml}
            />}

            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    itemsResult= {itemsResult}
                    viewSettings={viewSettings}
                    setViewSettings={setViewSettings}
                />
            </div>
        </div>
    );
};

export default ViewItemsContainer;
