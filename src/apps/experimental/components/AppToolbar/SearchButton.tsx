import React, { type FC } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import globalize from 'lib/globalize';
import { IconButton } from 'ui-primitives';
import { Tooltip } from 'ui-primitives';
import { useSearchParams } from 'hooks/useSearchParams';

const getUrlParams = (searchParams: URLSearchParams) => {
    const parentId = searchParams.get('parentId') || searchParams.get('topParentId');
    const collectionType = searchParams.get('collectionType');
    const params = new URLSearchParams();

    if (parentId) {
        params.set('parentId', parentId);
    }

    if (collectionType) {
        params.set('collectionType', collectionType);
    }

    return params;
};

const SearchButton: FC = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const isSearchPath = location.pathname === '/search';
    const search = getUrlParams(searchParams);
    const createSearchLink = {
        pathname: '/search',
        search: search.toString() ? `?${search}` : undefined
    };

    const onSearchClick = () => {
        if (!isSearchPath) {
            navigate({ to: `${createSearchLink.pathname}${createSearchLink.search ?? ''}` });
        }
    };

    return (
        <Tooltip title={globalize.translate('Search')}>
            <IconButton
                size="lg"
                aria-label={globalize.translate('Search')}
                disabled={isSearchPath}
                onClick={onSearchClick}
            >
                <MagnifyingGlassIcon />
            </IconButton>
        </Tooltip>
    );
};

export default SearchButton;
