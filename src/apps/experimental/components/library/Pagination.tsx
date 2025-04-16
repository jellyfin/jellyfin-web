import React, { FC, useCallback } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Stack from '@mui/material/Stack';

import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { LibraryViewSettings } from 'types/library';

interface PaginationProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
    totalRecordCount: number;
    isPlaceholderData: boolean
}

const Pagination: FC<PaginationProps> = ({
    libraryViewSettings,
    setLibraryViewSettings,
    totalRecordCount,
    isPlaceholderData
}) => {
    const limit = userSettings.libraryPageSize(undefined);
    const startIndex = libraryViewSettings.StartIndex ?? 0;
    const recordsStart = totalRecordCount ? startIndex + 1 : 0;
    const recordsEnd = limit ?
        Math.min(startIndex + limit, totalRecordCount) :
        totalRecordCount;
    const showControls = limit > 0 && limit < totalRecordCount;

    const onNextPageClick = useCallback(() => {
        const newIndex = startIndex + limit;
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    const onPreviousPageClick = useCallback(() => {
        const newIndex = Math.max(0, startIndex - limit);
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    return (
        <Stack
            direction='row'
            spacing={0.5}
            sx={{
                alignItems: 'center',
                marginLeft: 0.5
            }}
        >
            <Box>
                {globalize.translate(
                    'ListPaging',
                    recordsStart,
                    recordsEnd,
                    totalRecordCount
                )}
            </Box>
            {showControls && (
                <ButtonGroup
                    color='inherit'
                    variant='text'
                >
                    <Button
                        title={globalize.translate('Previous')}
                        disabled={startIndex == 0 || isPlaceholderData}
                        onClick={onPreviousPageClick}
                    >
                        <ArrowBackIcon />
                    </Button>

                    <Button
                        title={globalize.translate('Next')}
                        disabled={startIndex + limit >= totalRecordCount || isPlaceholderData }
                        onClick={onNextPageClick}
                    >
                        <ArrowForwardIcon />
                    </Button>
                </ButtonGroup>
            )}
        </Stack>
    );
};

export default Pagination;
