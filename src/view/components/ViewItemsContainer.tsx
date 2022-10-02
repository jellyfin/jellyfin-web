import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

interface ViewItemsContainerI {
    topParentId: string | null;
    isBtnShuffleEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isAlphaPickerEnabled?: boolean;
    getBasekey: () => string;
    getFilterMode: () => string;
    getItemTypes: () => string;
    getSortMenuOptions: () => {
        name: string;
        id: string;
    }[];
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
    getSortMenuOptions,
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

    let query = useMemo<QueryI>(() => ({
        SortBy: 'SortName,ProductionYear',
        SortOrder: 'Ascending',
        IncludeItemTypes: getItemTypes(),
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        Limit: userSettings.libraryPageSize(undefined),
        StartIndex: 0,
        ParentId: topParentId
    }), [getItemTypes, topParentId]);

    if (getBasekey() === 'favorites') {
        query.IsFavorite = true;
    }

    query = userSettings.loadQuerySettings(getSettingsKey(), query);

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
        window.ApiClient.getItems(window.ApiClient.getCurrentUserId(), query).then((result) => {
            setItemsResult(result);
            window.scrollTo(0, 0);

            loading.hide();

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(page);
            });
        });
    }, [query]);

    useEffect(() => {
        reloadItems();
    }, [reloadItems]);

    return (
        <div ref={element}>
            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination itemsResult= {itemsResult} query={query} reloadItems={reloadItems} />

                {isBtnShuffleEnabled && <Shuffle itemsResult={itemsResult} topParentId={topParentId} />}
                <SelectView getCurrentViewStyle={getCurrentViewStyle} getViewSettings={getViewSettings} query={query} reloadItems={reloadItems} />
                <Sort getSortMenuOptions={getSortMenuOptions} query={query} getSettingsKey={getSettingsKey} reloadItems={reloadItems} />

                {isBtnFilterEnabled && <Filter query={query} getFilterMode={getFilterMode} reloadItems={reloadItems} />}

                {isBtnNewCollectionEnabled && <NewCollection />}

            </div>

            {isAlphaPickerEnabled && <AlphaPickerContainer query={query} reloadItems={reloadItems} />}

            <ItemsContainer
                getCurrentViewStyle={getCurrentViewStyle}
                query={query}
                getContext={getContext}
                items={itemsResult?.Items}
                noItemsMessage={getNoItemsMessage()}
            />

            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination itemsResult= {itemsResult} query={query} reloadItems={reloadItems} />
            </div>
        </div>
    );
};

export default ViewItemsContainer;
