import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import globalize from '../../scripts/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import { ViewQuerySettings } from '../../types/interface';

interface PaginationProps {
    viewQuerySettings: ViewQuerySettings;
    setViewQuerySettings: React.Dispatch<React.SetStateAction<ViewQuerySettings>>;
    itemsResult?: BaseItemDtoQueryResult;
}

const Pagination: FC<PaginationProps> = ({ viewQuerySettings, setViewQuerySettings, itemsResult = {} }) => {
    const limit = userSettings.libraryPageSize(undefined);
    const totalRecordCount = itemsResult.TotalRecordCount || 0;
    const startIndex = viewQuerySettings.StartIndex || 0;
    const recordsEnd = Math.min(startIndex + limit, totalRecordCount);
    const showControls = limit > 0 && limit < totalRecordCount;
    const element = useRef<HTMLDivElement>(null);

    const onNextPageClick = useCallback(() => {
        if (limit > 0) {
            const newIndex = startIndex + limit;
            setViewQuerySettings((prevState) => ({
                ...prevState,
                StartIndex: newIndex
            }));
        }
    }, [limit, setViewQuerySettings, startIndex]);

    const onPreviousPageClick = useCallback(() => {
        if (limit > 0) {
            const newIndex = Math.max(0, startIndex - limit);
            setViewQuerySettings((prevState) => ({
                ...prevState,
                StartIndex: newIndex
            }));
        }
    }, [limit, setViewQuerySettings, startIndex]);

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
                <div className='listPaging' style={{ display: 'flex', alignItems: 'center' }}>
                    <span>
                        {globalize.translate('ListPaging', (totalRecordCount ? startIndex + 1 : 0), recordsEnd || totalRecordCount, totalRecordCount)}
                    </span>
                    {showControls && (
                        <div style={{ display: 'inline-flex' }}>
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
        </div>
    );
};

export default Pagination;
