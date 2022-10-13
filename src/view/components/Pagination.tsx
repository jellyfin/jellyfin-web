import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import globalize from '../../scripts/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import { QueryI } from './interface';

interface PaginationProps {
    query: QueryI;
    setQuery: React.Dispatch<React.SetStateAction<QueryI>>;
    itemsResult?: BaseItemDtoQueryResult;
}

const Pagination: FC<PaginationProps> = ({ query, setQuery, itemsResult = {} }) => {
    const limit = userSettings.libraryPageSize(undefined);
    const totalRecordCount = itemsResult.TotalRecordCount || 0;
    const startIndex = query.StartIndex || 0;
    const recordsEnd = Math.min(startIndex + limit, totalRecordCount);
    const showControls = limit < totalRecordCount;
    const element = useRef<HTMLDivElement>(null);

    const onNextPageClick = useCallback(() => {
        if (limit > 0) {
            const newIndex = startIndex + limit;
            setQuery({StartIndex: newIndex});
        }
    }, [limit, setQuery, startIndex]);

    const onPreviousPageClick = useCallback(() => {
        if (limit > 0) {
            const newIndex = Math.max(0, startIndex - limit);
            setQuery({StartIndex: newIndex});
        }
    }, [limit, setQuery, startIndex]);

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

        return () => {
            btnNextPage?.removeEventListener('click', onNextPageClick);
            btnPreviousPage?.removeEventListener('click', onPreviousPageClick);
        };
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
