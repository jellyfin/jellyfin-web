import React, { useCallback, type FC } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import globalize from 'lib/globalize';

const SearchButton: FC = () => {
    const handleClick = useCallback(() => {
        window.dispatchEvent(new CustomEvent('quicksearch:open'));
    }, []);

    return (
        <Tooltip title={globalize.translate('Search')}>
            <IconButton
                size='large'
                aria-label={globalize.translate('Search')}
                color='inherit'
                onClick={handleClick}
            >
                <SearchIcon />
            </IconButton>
        </Tooltip>
    );
};

export default SearchButton;
