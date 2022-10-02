import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
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
import { QueryI } from './interface';
import NewCollection from './NewCollection';
import globalize from '../../scripts/globalize';

interface ViewItemsContainerI {
    topParentId: string | null;
    isBtnShuffleEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isAlphaPickerEnabled?: boolean;
    getBasekey: () => string;
    getItemTypes: () => string[];
    getNoItemsMessage: () => string;
}

const ViewItemsContainer: FC<ViewItemsContainerI> = ({
    topParentId,
    isBtnShuffleEnabled = false,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    isAlphaPickerEnabled = true,
    getBasekey,
    getItemTypes,
    getNoItemsMessage
}) => {
    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>({});

    const element = useRef<HTMLDivElement>(null);

    const getSettingsKey = useCallback(() => {
        return `${topParentId} - ${getBasekey()}`;
    }, [getBasekey, topParentId]);

    const getViewSettings = useCallback(() => {
        return `${getSettingsKey()} -view`;
    }, [getSettingsKey]);

    const getDefaultSortBy = useCallback(() => {
        return 'SortName';
    }, []);

    const getSortValues = useCallback(() => {
        const basekey = getSettingsKey();

        return {
            sortBy: userSettings.getFilter(basekey + '-sortby') || getDefaultSortBy(),
            sortOrder: userSettings.getFilter(basekey + '-sortorder') === 'Descending' ? 'Descending' : 'Ascending'
        };
    }, [getDefaultSortBy, getSettingsKey]);

    const getFilters = useCallback(() => {
        const basekey = getSettingsKey();
        return {
            IsPlayed: userSettings.getFilter(basekey + '-filter-IsPlayed') === 'true',
            IsUnplayed: userSettings.getFilter(basekey + '-filter-IsUnplayed') === 'true',
            IsFavorite: userSettings.getFilter(basekey + '-filter-IsFavorite') === 'true',
            IsResumable: userSettings.getFilter(basekey + '-filter-IsResumable') === 'true',
            Is4K: userSettings.getFilter(basekey + '-filter-Is4K') === 'true',
            IsHD: userSettings.getFilter(basekey + '-filter-IsHD') === 'true',
            IsSD: userSettings.getFilter(basekey + '-filter-IsSD') === 'true',
            Is3D: userSettings.getFilter(basekey + '-filter-Is3D') === 'true',
            VideoTypes: userSettings.getFilter(basekey + '-filter-VideoTypes'),
            SeriesStatus: userSettings.getFilter(basekey + '-filter-SeriesStatus'),
            HasSubtitles: userSettings.getFilter(basekey + '-filter-HasSubtitles'),
            HasTrailer: userSettings.getFilter(basekey + '-filter-HasTrailer'),
            HasSpecialFeature: userSettings.getFilter(basekey + '-filter-HasSpecialFeature'),
            HasThemeSong: userSettings.getFilter(basekey + '-filter-HasThemeSong'),
            HasThemeVideo: userSettings.getFilter(basekey + '-filter-HasThemeVideo'),
            GenreIds: userSettings.getFilter(basekey + '-filter-GenreIds')
        };
    }, [getSettingsKey]);

    const getFilterMenuOptions = useCallback(() => {
        return {};
    }, []);

    const getVisibleFilters = useCallback(() => {
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
    }, []);

    const getQuery = useCallback(() => {
        const query: QueryI = {
            SortBy: getSortValues().sortBy,
            SortOrder: getSortValues().sortOrder,
            IncludeItemTypes: getItemTypes().join(','),
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            Limit: userSettings.libraryPageSize(undefined),
            StartIndex: 0,
            ParentId: topParentId
        };

        if (getBasekey() === 'favorites') {
            query.IsFavorite = true;
        }

        userSettings.loadQuerySettings(getSettingsKey(), query);
        return query;
    }, [getSortValues, getItemTypes, topParentId, getBasekey, getSettingsKey]);

    const getQueryWithFilters = useCallback(() => {
        const query = getQuery();

        const queryFilters = [];
        let hasFilters;

        const filters = getFilters();

        if (filters.IsPlayed) {
            queryFilters.push('IsPlayed');
            hasFilters = true;
        }

        if (filters.IsUnplayed) {
            queryFilters.push('IsUnplayed');
            hasFilters = true;
        }

        if (filters.IsFavorite) {
            queryFilters.push('IsFavorite');
            hasFilters = true;
        }

        if (filters.IsResumable) {
            queryFilters.push('IsResumable');
            hasFilters = true;
        }

        if (filters.VideoTypes) {
            hasFilters = true;
            query.VideoTypes = filters.VideoTypes;
        }

        if (filters.GenreIds) {
            hasFilters = true;
            query.GenreIds = filters.GenreIds;
        }

        if (filters.Is4K) {
            query.Is4K = true;
            hasFilters = true;
        }

        if (filters.IsHD) {
            query.IsHD = true;
            hasFilters = true;
        }

        if (filters.IsSD) {
            query.IsHD = false;
            hasFilters = true;
        }

        if (filters.Is3D) {
            query.Is3D = true;
            hasFilters = true;
        }

        if (filters.HasSubtitles) {
            query.HasSubtitles = true;
            hasFilters = true;
        }

        if (filters.HasTrailer) {
            query.HasTrailer = true;
            hasFilters = true;
        }

        if (filters.HasSpecialFeature) {
            query.HasSpecialFeature = true;
            hasFilters = true;
        }

        if (filters.HasThemeSong) {
            query.HasThemeSong = true;
            hasFilters = true;
        }

        if (filters.HasThemeVideo) {
            query.HasThemeVideo = true;
            hasFilters = true;
        }

        query.Filters = queryFilters.length ? queryFilters.join(',') : null;

        return {
            query: query,
            hasFilters: hasFilters
        };
    }, [getQuery, getFilters]);

    const getSortMenuOptions = useCallback(() => {
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
    }, []);

    const getCurrentViewStyle = useCallback(() => {
        return userSettings.get(getViewSettings(), false) || 'Poster';
    }, [getViewSettings]);

    const getContext = useCallback(() => {
        const itemType = getItemTypes().join(',');
        if (itemType === 'Movie' || itemType === 'BoxSet') {
            return 'movies';
        }

        return null;
    }, [getItemTypes]);

    const reloadItems = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        loading.show();
        const querywithfilters = getQueryWithFilters().query;
        window.ApiClient.getItems(window.ApiClient.getCurrentUserId(), querywithfilters).then((result) => {
            setItemsResult(result);
            window.scrollTo(0, 0);

            loading.hide();

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(page);
            });
        });
    }, [getQueryWithFilters]);

    useEffect(() => {
        reloadItems();
    }, [reloadItems]);

    return (
        <div ref={element}>
            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination itemsResult= {itemsResult} query={getQuery()} reloadItems={reloadItems} />

                {isBtnShuffleEnabled && <Shuffle itemsResult={itemsResult} topParentId={topParentId} />}
                <SelectView getCurrentViewStyle={getCurrentViewStyle} getViewSettings={getViewSettings} query={getQuery()} reloadItems={reloadItems} />

                <Sort
                    getSortMenuOptions={getSortMenuOptions}
                    getSortValues={getSortValues}
                    getSettingsKey={getSettingsKey}
                    reloadItems={reloadItems}
                />

                {isBtnFilterEnabled && <Filter
                    topParentId={topParentId}
                    getFilters={getFilters}
                    getSettingsKey={getSettingsKey}
                    getItemTypes={getItemTypes}
                    getVisibleFilters={getVisibleFilters}
                    getFilterMenuOptions={getFilterMenuOptions}
                    reloadItems={reloadItems}
                />}

                {isBtnNewCollectionEnabled && <NewCollection />}

            </div>

            {isAlphaPickerEnabled && <AlphaPickerContainer query={getQuery()} reloadItems={reloadItems} />}

            <ItemsContainer
                getCurrentViewStyle={getCurrentViewStyle}
                query={getQuery()}
                getContext={getContext}
                items={itemsResult?.Items}
                noItemsMessage={getNoItemsMessage()}
            />

            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination itemsResult= {itemsResult} query={getQuery()} reloadItems={reloadItems} />
            </div>
        </div>
    );
};

export default ViewItemsContainer;
