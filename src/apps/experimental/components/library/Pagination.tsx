import React, { type FC, useCallback } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { Box, Flex } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Text } from 'ui-primitives';
import useMediaQuery from 'hooks/useMediaQuery';
import { vars } from 'styles/tokens.css.ts';

import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { type LibraryViewSettings } from 'types/library';
import { scrollPageToTop } from 'components/sitbackMode/sitback.logic';

interface PaginationProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
    totalRecordCount: number;
    isPlaceholderData: boolean;
}

const Pagination: FC<PaginationProps> = ({
    libraryViewSettings,
    setLibraryViewSettings,
    totalRecordCount,
    isPlaceholderData
}) => {
    const isSmallScreen = useMediaQuery('(min-width: 600px)');

    const limit = userSettings.libraryPageSize(undefined);
    const startIndex = libraryViewSettings.StartIndex ?? 0;
    const recordsStart = totalRecordCount ? startIndex + 1 : 0;
    const recordsEnd = limit ? Math.min(startIndex + limit, totalRecordCount) : totalRecordCount;
    const showControls = limit > 0 && limit < totalRecordCount;

    const onNextPageClick = useCallback(() => {
        scrollPageToTop();
        const newIndex = startIndex + limit;
        setLibraryViewSettings(prevState => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    const onPreviousPageClick = useCallback(() => {
        scrollPageToTop();
        const newIndex = Math.max(0, startIndex - limit);
        setLibraryViewSettings(prevState => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    return (
        <Flex
            align="center"
            gap={vars.spacing['2']}
            style={{
                flexGrow: isSmallScreen ? 0 : 1,
                marginLeft: isSmallScreen ? vars.spacing['2'] : 0
            }}
        >
            {!isSmallScreen && (
                <Button
                    variant="plain"
                    title={globalize.translate('Previous')}
                    disabled={!showControls || startIndex == 0 || isPlaceholderData}
                    onClick={onPreviousPageClick}
                >
                    <ArrowLeftIcon />
                </Button>
            )}

            <Box
                style={{
                    display: 'flex',
                    flexGrow: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: vars.spacing['4'],
                    marginRight: vars.spacing['4']
                }}
            >
                <Text size="sm" color="secondary">
                    {globalize.translate('ListPaging', recordsStart, recordsEnd, totalRecordCount)}
                </Text>
            </Box>

            {isSmallScreen && (
                <Flex align="center" gap={vars.spacing['2']}>
                    <Button
                        variant="plain"
                        title={globalize.translate('Previous')}
                        disabled={!showControls || startIndex == 0 || isPlaceholderData}
                        onClick={onPreviousPageClick}
                    >
                        <ArrowLeftIcon />
                    </Button>

                    <Button
                        variant="plain"
                        title={globalize.translate('Next')}
                        disabled={!showControls || startIndex + limit >= totalRecordCount || isPlaceholderData}
                        onClick={onNextPageClick}
                    >
                        <ArrowRightIcon />
                    </Button>
                </Flex>
            )}

            {!isSmallScreen && (
                <Button
                    variant="plain"
                    title={globalize.translate('Next')}
                    disabled={!showControls || startIndex + limit >= totalRecordCount || isPlaceholderData}
                    onClick={onNextPageClick}
                >
                    <ArrowRightIcon />
                </Button>
            )}
        </Flex>
    );
};

export default Pagination;
