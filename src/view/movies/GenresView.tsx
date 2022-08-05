import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import loading from '../../components/loading/loading';
import * as userSettings from '../../scripts/settings/userSettings';
import GenresItemsContainer from '../components/GenresItemsContainer';
import { IQuery } from '../components/type';

type IProps = {
    topParentId: string | null;
}

const GenresView: FunctionComponent<IProps> = ({ topParentId }: IProps) => {
    const savedQueryKey = topParentId + '-moviegenres';
    const savedViewKey = savedQueryKey + '-view';

    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>({});
    const element = useRef<HTMLDivElement>(null);

    const query = useMemo<IQuery>(() => ({
        SortBy: 'SortName',
        SortOrder: 'Ascending',
        IncludeItemTypes: 'Movie',
        Recursive: true,
        EnableTotalRecordCount: false,
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
        window.ApiClient.getGenres(window.ApiClient.getCurrentUserId(), query).then((result) => {
            setItemsResult(result);
            loading.hide();
        });
    }, [query]);

    useEffect(() => {
        reloadItems();
    }, [reloadItems]);
    return (
        <div ref={element}>
            <GenresItemsContainer topParentId={topParentId} getCurrentViewStyle={getCurrentViewStyle} query={query} itemsResult={itemsResult} />
        </div>
    );
};

export default GenresView;
