import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useEffect, useRef } from 'react';
import libraryBrowser from '../../scripts/libraryBrowser';

import * as userSettings from '../../scripts/settings/userSettings';
import { IQuery } from './type';

type PaginationProps = {
    query: IQuery;
    itemsResult?: BaseItemDtoQueryResult;
    reloadItems: () => void;
}

const Pagination: FunctionComponent<PaginationProps> = ({ query, itemsResult = {}, reloadItems }: PaginationProps) => {
    const element = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function onNextPageClick() {
            if (userSettings.libraryPageSize(undefined) > 0) {
                query.StartIndex += query.Limit;
            }
            reloadItems();
        }

        function onPreviousPageClick() {
            if (userSettings.libraryPageSize(undefined) > 0) {
                query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
            }
            reloadItems();
        }
        const pagingHtml = libraryBrowser.getQueryPagingHtml({
            startIndex: query.StartIndex,
            limit: query.Limit,
            totalRecordCount: itemsResult.TotalRecordCount,
            showLimit: false,
            updatePageSizeSetting: false,
            addLayoutButton: false,
            sortButton: false,
            filterButton: false
        });

        const paging = element.current?.querySelector('.paging') as HTMLDivElement;
        paging.innerHTML = pagingHtml;

        const btnNextPage = element.current?.querySelector('.btnNextPage') as HTMLButtonElement;
        if (btnNextPage) {
            btnNextPage.addEventListener('click', onNextPageClick);
        }

        const btnPreviousPage = element.current?.querySelector('.btnPreviousPage') as HTMLButtonElement;
        if (btnPreviousPage) {
            btnPreviousPage.addEventListener('click', onPreviousPageClick);
        }
    }, [itemsResult, query, reloadItems]);

    return (
        <div ref={element}>
            <div
                className='paging'
            />
        </div>

    );
};

export default Pagination;
