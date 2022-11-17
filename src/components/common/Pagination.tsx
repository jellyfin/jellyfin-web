import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC } from 'react';
import IconButton from '../../elements/emby-button/IconButton';
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

    const onNextPageClick = () => {
        if (limit > 0) {
            const newIndex = startIndex + limit;
            setViewQuerySettings((prevState) => ({
                ...prevState,
                StartIndex: newIndex
            }));
        }
    };

    const onPreviousPageClick = () => {
        if (limit > 0) {
            const newIndex = Math.max(0, startIndex - limit);
            setViewQuerySettings((prevState) => ({
                ...prevState,
                StartIndex: newIndex
            }));
        }
    };

    return (
        <div className='paging'>
            {showControls && (
                <div className='listPaging' style={{ display: 'flex', alignItems: 'center' }}>

                    <span>
                        {globalize.translate('ListPaging', (totalRecordCount ? startIndex + 1 : 0), recordsEnd, totalRecordCount)}
                    </span>

                    <IconButton
                        type='button'
                        className='btnPreviousPage autoSize'
                        icon='arrow_back'
                        disabled={startIndex ? false : true}
                        onClick={onPreviousPageClick}
                    />
                    <IconButton
                        type='button'
                        className='btnNextPage autoSize'
                        icon='arrow_forward'
                        disabled={startIndex + limit >= totalRecordCount ? true : false}
                        onClick={onNextPageClick}
                    />
                </div>
            )}
        </div>
    );
};

export default Pagination;
