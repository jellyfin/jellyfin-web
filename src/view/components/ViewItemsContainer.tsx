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
    getFilterMode: () => string;
    getItemTypes: () => string;
    getNoItemsMessage: () => string;
}

const ViewItemsContainer: FC<ViewItemsContainerI> = ({
    topParentId,
    isBtnShuffleEnabled = false,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    isAlphaPickerEnabled = true,
    getBasekey,
    getFilterMode,
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

    const getQuery = useCallback(() => {
        const query: QueryI = {
            SortBy: getSortValues().sortBy,
            SortOrder: getSortValues().sortOrder,
            IncludeItemTypes: getItemTypes(),
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
        const itemType = getItemTypes();
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
        const query = getQuery();
        window.ApiClient.getItems(window.ApiClient.getCurrentUserId(), query).then((result) => {
            setItemsResult(result);
            window.scrollTo(0, 0);

            loading.hide();

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(page);
            });
        });
    }, [getQuery]);

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

                {isBtnFilterEnabled && <Filter query={getQuery()} getFilterMode={getFilterMode} reloadItems={reloadItems} />}

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
