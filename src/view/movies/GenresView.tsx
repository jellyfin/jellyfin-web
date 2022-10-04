import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import loading from '../../components/loading/loading';
import * as userSettings from '../../scripts/settings/userSettings';
import GenresItemsContainer from '../components/GenresItemsContainer';
import { QueryI } from '../components/interface';

interface GenresViewI {
    topParentId: string | null;
}

const GenresView: FC<GenresViewI> = ({ topParentId }) => {
    const [ itemsResult, setItemsResult ] = useState<BaseItemDtoQueryResult>({});
    const element = useRef<HTMLDivElement>(null);

    const getSettingsKey = useCallback(() => {
        return topParentId + '-genres';
    }, [topParentId]);

    const getViewSettings = useCallback(() => {
        return getSettingsKey() + '-view';
    }, [getSettingsKey]);

    let query = useMemo<QueryI>(() => ({
        SortBy: 'SortName',
        SortOrder: 'Ascending',
        IncludeItemTypes: 'Movie',
        Recursive: true,
        EnableTotalRecordCount: false,
        Limit: userSettings.libraryPageSize(undefined),
        StartIndex: 0,
        ParentId: topParentId }), [topParentId]);

    query = userSettings.loadQuerySettings(getSettingsKey(), query);

    const getCurrentViewStyle = useCallback(() => {
        return userSettings.get(getViewSettings(), false) || 'Poster';
    }, [getViewSettings]);

    const reloadItems = useCallback(() => {
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
            <GenresItemsContainer topParentId={topParentId} getCurrentViewStyle={getCurrentViewStyle} itemsResult={itemsResult} />
        </div>
    );
};

export default GenresView;
