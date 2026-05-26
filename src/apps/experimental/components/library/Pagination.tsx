import React, { FC, useCallback } from 'react';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

import globalize from 'lib/globalize';
import type { LibraryViewSettings } from 'types/library';

interface PaginationProps {
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>
    index: number
    pageSize: number
    total: number
    disabled?: boolean
}

const Pagination: FC<PaginationProps> = ({
    setLibraryViewSettings,
    index,
    pageSize,
    total,
    disabled
}) => {
    const onNextPageClick = useCallback(() => {
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: index + pageSize
        }));
        window.scrollTo(0, 0);
    }, [index, pageSize, setLibraryViewSettings]);

    const onPreviousPageClick = useCallback(() => {
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: Math.max(0, index - pageSize)
        }));
        window.scrollTo(0, 0);
    }, [index, pageSize, setLibraryViewSettings]);

    return (
        <ButtonGroup
            color='inherit'
            variant='text'
        >
            <Button
                title={globalize.translate('Previous')}
                disabled={disabled || index == 0}
                onClick={onPreviousPageClick}
            >
                <NavigateBeforeIcon />
            </Button>

            <Button
                title={globalize.translate('Next')}
                disabled={disabled || index + pageSize >= total}
                onClick={onNextPageClick}
            >
                <NavigateNextIcon />
            </Button>
        </ButtonGroup>
    );
};

export default Pagination;
