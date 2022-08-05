import '../../elements/emby-itemscontainer/emby-itemscontainer';

import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import AlphaPickerContainer from '../components/AlphaPickerContainer';
import Filter from '../components/Filter';
import ItemsContainer from '../components/ItemsContainer';
import Pagination from '../components/Pagination';
import Sort from '../components/Sort';
import { IQuery } from '../components/type';

const SortMenuOptions = () => {
    return [{
        name: globalize.translate('Name'),
        id: 'SortName'
    }, {
        name: globalize.translate('OptionImdbRating'),
        id: 'CommunityRating,SortName'
    }, {
        name: globalize.translate('OptionDateAdded'),
        id: 'DateCreated,SortName'
    }, {
        name: globalize.translate('OptionDatePlayed'),
        id: 'DatePlayed,SortName'
    }, {
        name: globalize.translate('OptionParentalRating'),
        id: 'OfficialRating,SortName'
    }, {
        name: globalize.translate('OptionPlayCount'),
        id: 'PlayCount,SortName'
    }, {
        name: globalize.translate('OptionReleaseDate'),
        id: 'PremiereDate,SortName'
    }];
};

type IProps = {
    topParentId: string | null;
}

const TrailersView: FunctionComponent<IProps> = ({ topParentId }: IProps) => {
    const savedQueryKey = topParentId + '-trailers';
    const savedViewKey = savedQueryKey + '-view';

    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>();
    const element = useRef<HTMLDivElement>(null);

    const query = useMemo<IQuery>(() => ({
        SortBy: 'SortName',
        SortOrder: 'Ascending',
        IncludeItemTypes: 'Trailer',
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        Limit: userSettings.libraryPageSize(undefined),
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

                <Sort SortMenuOptions={SortMenuOptions} query={query} savedQueryKey={savedQueryKey} reloadItems={reloadItems} />
                <Filter query={query} reloadItems={reloadItems} />

            </div>

            <AlphaPickerContainer query={query} reloadItems={reloadItems} />

            <ItemsContainer getCurrentViewStyle={getCurrentViewStyle} query={query} items={itemsResult?.Items} noItemsMessage= 'MessageNoTrailersFound' />

            <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination itemsResult= {itemsResult} query={query} reloadItems={reloadItems} />
            </div>
        </div>
    );
};

export default TrailersView;
