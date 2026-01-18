import React, { FC, useCallback } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import ButtonGroup from '@mui/material/ButtonGroup/ButtonGroup';
import Stack from '@mui/material/Stack/Stack';
import type { Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { LibraryViewSettings } from 'types/library';
import { scrollPageToTop } from 'components/sitbackMode/sitback.logic';

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
    const isSmallScreen = useMediaQuery((t: Theme) => t.breakpoints.up('sm'));

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
        <Stack
            direction='row'
            spacing={0.5}
            sx={{
                alignItems: 'center',
                flexGrow: {
                    xs: 1,
                    sm: 0
                },
                marginLeft: {
                    xs: 0,
                    sm: 0.5
                }
            }}
        >
            {!isSmallScreen && (
                <Button
                    color='inherit'
                    variant='text'
                    title={globalize.translate('Previous')}
                    disabled={!showControls || startIndex == 0 || isPlaceholderData}
                    onClick={onPreviousPageClick}
                >
                    <ArrowBackIcon />
                </Button>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 1,
                    marginRight: 1
                }}
            >
                <Typography variant='body2'>
                    {globalize.translate(
                        'ListPaging',
                        recordsStart,
                        recordsEnd,
                        totalRecordCount
                    )}
                </Typography>
            </Box>

            {isSmallScreen && (
                <ButtonGroup
                    color='inherit'
                    variant='text'
                >
                    <Button
                        title={globalize.translate('Previous')}
                        disabled={!showControls || startIndex == 0 || isPlaceholderData}
                        onClick={onPreviousPageClick}
                    >
                        <ArrowBackIcon />
                    </Button>

                    <Button
                        title={globalize.translate('Next')}
                        disabled={!showControls || startIndex + limit >= totalRecordCount || isPlaceholderData }
                        onClick={onNextPageClick}
                    >
                        <ArrowForwardIcon />
                    </Button>
                </ButtonGroup>
            )}

            {!isSmallScreen && (
                <Button
                    color='inherit'
                    variant='text'
                    title={globalize.translate('Next')}
                    disabled={!showControls || startIndex + limit >= totalRecordCount || isPlaceholderData }
                    onClick={onNextPageClick}
                >
                    <ArrowForwardIcon />
                </Button>
            )}
        </Stack>
    );
};

export default Pagination;
