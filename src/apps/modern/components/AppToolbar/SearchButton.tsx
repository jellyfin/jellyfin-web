import React, { type FC } from 'react';
import {
    Link,
    URLSearchParamsInit,
    createSearchParams,
    useLocation,
    useSearchParams
} from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import globalize from 'lib/globalize';

const getUrlParams = (searchParams: URLSearchParams) => {
    const parentId =
        searchParams.get('parentId') || searchParams.get('topParentId');
    const collectionType = searchParams.get('collectionType');
    const params: URLSearchParamsInit = {};

    if (parentId) {
        params.parentId = parentId;
    }

    if (collectionType) {
        params.collectionType = collectionType;
    }
    return params;
};

const SearchButton: FC = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const isSearchPath = location.pathname === '/search';
    const search = createSearchParams(getUrlParams(searchParams));
    const createSearchLink =
        {
            pathname: '/search',
            search: search ? `?${search}` : undefined
        };

    return (
        <Tooltip title={globalize.translate('Search')}>
            <IconButton
                size='large'
                aria-label={globalize.translate('Search')}
                color='inherit'
                component={Link}
                disabled={isSearchPath}
                to={createSearchLink}
            >
                <SearchIcon />
            </IconButton>
        </Tooltip>
    );
};

export default SearchButton;
