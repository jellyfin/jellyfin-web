import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import AlphaPickerContainer from '../components/AlphaPickerContainer';
import Filter from '../components/Filter';
import ItemsContainer from '../components/ItemsContainer';
import Pagination from '../components/Pagination';
import SelectView from '../components/SelectView';
import Sort from '../components/Sort';
import { IQuery } from '../components/type';

type IProps = {
    topParentId: string | null;
}

const SortMenuOptions = () => {
    return [{
        name: globalize.translate('Name'),
        id: 'SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionRandom'),
        id: 'Random'
    }, {
        name: globalize.translate('OptionImdbRating'),
        id: 'CommunityRating,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionCriticRating'),
        id: 'CriticRating,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionDateAdded'),
        id: 'DateCreated,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionDatePlayed'),
        id: 'DatePlayed,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionParentalRating'),
        id: 'OfficialRating,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionPlayCount'),
        id: 'PlayCount,SortName,ProductionYear'
    }, {
        name: globalize.translate('OptionReleaseDate'),
        id: 'PremiereDate,SortName,ProductionYear'
    }, {
        name: globalize.translate('Runtime'),
        id: 'Runtime,SortName,ProductionYear'
    }];
};

const FavoritesView: FunctionComponent<IProps> = ({ topParentId }: IProps) => {
    const savedQueryKey = topParentId + '-favorites';
    const savedViewKey = savedQueryKey + '-view';

    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>({});
    const element = useRef<HTMLDivElement>(null);

    const query = useMemo<IQuery>(() => ({
        SortBy: 'SortName,ProductionYear',
        SortOrder: 'Ascending',
        IncludeItemTypes: 'Movie',
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        Limit: userSettings.libraryPageSize(undefined),
        IsFavorite: true,
        StartIndex: 0,
        ParentId: topParentId }), [topParentId]);

    userSettings.loadQuerySettings(savedQueryKey, query);

    const getCurrentViewStyle = useCallback(() => {
        return userSettings.get(savedViewKey, false) || 'Poster';
    }, [savedViewKey]);

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

    const onViewStyleChange = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const viewStyle = getCurrentViewStyle();
        const itemsContainer = page.querySelector('.itemsContainer') as HTMLDivElement;
        if (viewStyle == 'List') {
            itemsContainer.classList.add('vertical-list');
            itemsContainer.classList.remove('vertical-wrap');
        } else {
            itemsContainer.classList.remove('vertical-list');
            itemsContainer.classList.add('vertical-wrap');
        }

        itemsContainer.innerHTML = '';
    }, [getCurrentViewStyle]);

    useEffect(() => {
        onViewStyleChange();
        reloadItems();
    }, [onViewStyleChange, query, reloadItems]);

    return (
        <div ref={element}>
            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination itemsResult= {itemsResult} query={query} reloadItems={reloadItems} />

                <SelectView getCurrentViewStyle={getCurrentViewStyle} savedViewKey={savedViewKey} query={query} onViewStyleChange={onViewStyleChange} reloadItems={reloadItems} />
                <Sort sortMenuOptions={SortMenuOptions} query={query} savedQueryKey={savedQueryKey} reloadItems={reloadItems} />
                <Filter query={query} reloadItems={reloadItems} />

            </div>

            <AlphaPickerContainer query={query} reloadItems={reloadItems} />

            <ItemsContainer getCurrentViewStyle={getCurrentViewStyle} query={query} items={itemsResult?.Items} noItemsMessage= 'MessageNoFavoritesAvailable' />

            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination itemsResult= {itemsResult} query={query} reloadItems={reloadItems} />
            </div>
        </div>
    );
};

export default FavoritesView;
