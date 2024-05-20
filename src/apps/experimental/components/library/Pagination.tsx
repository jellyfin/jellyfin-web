import React, { FC, useCallback } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';

import globalize from 'scripts/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { LibraryViewSettings } from 'types/library';
import { scrollPageToTop } from 'components/sitbackMode/sitback.logic';

interface PaginationProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
    totalRecordCount: number;
    isPreviousData: boolean
}

const Pagination: FC<PaginationProps> = ({
    libraryViewSettings,
    setLibraryViewSettings,
    totalRecordCount,
    isPreviousData
}) => {
    const limit = userSettings.libraryPageSize(undefined);
    const startIndex = libraryViewSettings.StartIndex ?? 0;
    const recordsStart = totalRecordCount ? startIndex + 1 : 0;
    const recordsEnd = limit ?
        Math.min(startIndex + limit, totalRecordCount) :
        totalRecordCount;
    const showControls = limit > 0 && limit < totalRecordCount;

    const onNextPageClick = useCallback(() => {
        scrollPageToTop();
        const newIndex = startIndex + limit;
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    const onPreviousPageClick = useCallback(() => {
        scrollPageToTop();
        const newIndex = Math.max(0, startIndex - limit);
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    return (
        <Box className='paging'>
            <Box
                className='listPaging'
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <span>
                    {globalize.translate(
                        'ListPaging',
                        recordsStart,
                        recordsEnd,
                        totalRecordCount
                    )}
                </span>
                {showControls && (
                    <ButtonGroup>
                        <IconButton
                            title={globalize.translate('Previous')}
                            className='paper-icon-button-light btnPreviousPage autoSize'
                            disabled={startIndex == 0 || isPreviousData}
                            onClick={onPreviousPageClick}
                        >
                            <ArrowBackIcon />
                        </IconButton>

                        <IconButton
                            title={globalize.translate('Next')}
                            className='paper-icon-button-light btnNextPage autoSize'
                            disabled={startIndex + limit >= totalRecordCount || isPlaceholderData }
                            onClick={onNextPageClick}
                        >
                            <ArrowForwardIcon />
                        </IconButton>
                    </ButtonGroup>
                )}
            </Box>
        </Box>
    );
};

export default Pagination;
