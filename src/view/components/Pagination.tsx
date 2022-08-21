import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import globalize from '../../scripts/globalize';
import { IQuery } from './type';

type PaginationProps = {
    query: IQuery;
    itemsResult?: BaseItemDtoQueryResult;
    reloadItems: () => void;
}

const Pagination: FunctionComponent<PaginationProps> = ({ query, itemsResult = {}, reloadItems }: PaginationProps) => {
    const startIndex = query.StartIndex;
    const limit = query.Limit;
    const totalRecordCount = itemsResult.TotalRecordCount || 0;
    const recordsEnd = Math.min(startIndex + limit, totalRecordCount);
    const showControls = limit < totalRecordCount;
    const element = useRef<HTMLDivElement>(null);

    const onNextPageClick = useCallback(() => {
        if (query.Limit > 0) {
            query.StartIndex += query.Limit;
        }
        reloadItems();
    }, [query, reloadItems]);

    const onPreviousPageClick = useCallback(() => {
        if (query.Limit > 0) {
            query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
        }
        reloadItems();
    }, [query, reloadItems]);

    useEffect(() => {
        const btnNextPage = element.current?.querySelector('.btnNextPage') as HTMLButtonElement;
        if (btnNextPage) {
            if (startIndex + limit >= totalRecordCount) {
                btnNextPage.disabled = true;
            } else {
                btnNextPage.disabled = false;
            }
            btnNextPage.addEventListener('click', onNextPageClick);
        }

        const btnPreviousPage = element.current?.querySelector('.btnPreviousPage') as HTMLButtonElement;
        if (btnPreviousPage) {
            if (startIndex) {
                btnPreviousPage.disabled = false;
            } else {
                btnPreviousPage.disabled = true;
            }
            btnPreviousPage.addEventListener('click', onPreviousPageClick);
        }
    }, [totalRecordCount, onNextPageClick, onPreviousPageClick, limit, startIndex]);

    return (
        <div ref={element}>
            <div className='paging'>
                {showControls && (
                    <div className='listPaging' style={{ display: 'flex', alignItems: 'center' }}>

                        <span>
                            {globalize.translate('ListPaging', (totalRecordCount ? startIndex + 1 : 0), recordsEnd, totalRecordCount)}
                        </span>

                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnPreviousPage autoSize'
                            icon='material-icons arrow_back'
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnNextPage autoSize'
                            icon='material-icons arrow_forward'
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pagination;
