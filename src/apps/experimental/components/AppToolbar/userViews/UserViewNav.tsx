import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Favorite from '@mui/icons-material/Favorite';
import Button from '@mui/material/Button/Button';
import Icon from '@mui/material/Icon';
import { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import LibraryIcon from 'apps/experimental/components/LibraryIcon';
import { MetaView } from 'apps/experimental/constants/metaView';
import { isLibraryPath } from 'apps/experimental/features/libraries/utils/path';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import useCurrentTab from 'hooks/useCurrentTab';
import { useUserViews } from 'hooks/useUserViews';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'lib/globalize';

import UserViewsMenu from './UserViewsMenu';

const MAX_USER_VIEWS_MD = 3;
const MAX_USER_VIEWS_LG = 5;
const MAX_USER_VIEWS_XL = 8;

const OVERFLOW_MENU_ID = 'user-view-overflow-menu';

const HOME_PATH = '/home';
const LIST_PATH = '/list';

const getCurrentUserView = (
    userViews: BaseItemDto[] | undefined,
    pathname: string,
    libraryId: string | null,
    collectionType: string | null,
    tab: number
) => {
    const isUserViewPath = isLibraryPath(pathname) || [HOME_PATH, LIST_PATH].includes(pathname);
    if (!isUserViewPath) return undefined;

    if (collectionType === CollectionType.Livetv) {
        return userViews?.find(({ CollectionType: type }) => type === CollectionType.Livetv);
    }

    if (pathname === HOME_PATH && tab === 1) {
        return MetaView.Favorites;
    }

    // eslint-disable-next-line sonarjs/different-types-comparison
    return userViews?.find(({ Id: id }) => id === libraryId);
};

const UserViewNav = () => {
    const location = useLocation();
    const [ searchParams ] = useSearchParams();
    const libraryId = searchParams.get('topParentId') || searchParams.get('parentId');
    const collectionType = searchParams.get('collectionType');
    const { activeTab } = useCurrentTab();
    const webConfig = useWebConfig();

    const isExtraLargeScreen = useMediaQuery((t: Theme) => t.breakpoints.up('xl'));
    const isLargeScreen = useMediaQuery((t: Theme) => t.breakpoints.up('lg'));
    const maxViews = useMemo(() => {
        let _maxViews = MAX_USER_VIEWS_MD;
        if (isExtraLargeScreen) _maxViews = MAX_USER_VIEWS_XL;
        else if (isLargeScreen) _maxViews = MAX_USER_VIEWS_LG;

        const customLinks = (webConfig.menuLinks || []).length;

        return _maxViews - customLinks;
    }, [ isExtraLargeScreen, isLargeScreen, webConfig.menuLinks ]);

    const { user } = useApi();
    const {
        data: userViews,
        isPending
    } = useUserViews(user?.Id);

    const primaryViews = useMemo(() => (
        userViews?.Items?.slice(0, maxViews)
    ), [ maxViews, userViews ]);

    const overflowViews = useMemo(() => (
        userViews?.Items?.slice(maxViews)
    ), [ maxViews, userViews ]);

    const [ overflowAnchorEl, setOverflowAnchorEl ] = useState<null | HTMLElement>(null);
    const isOverflowMenuOpen = Boolean(overflowAnchorEl);

    const onOverflowButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setOverflowAnchorEl(event.currentTarget);
    }, []);

    const onOverflowMenuClose = useCallback(() => {
        setOverflowAnchorEl(null);
    }, []);

    const currentUserView = useMemo(() => (
        getCurrentUserView(userViews?.Items, location.pathname, libraryId, collectionType, activeTab)
    ), [ activeTab, collectionType, libraryId, location.pathname, userViews ]);

    if (isPending) return null;

    return (
        <>
            <Button
                variant='text'
                color={(currentUserView?.Id === MetaView.Favorites.Id) ? 'primary' : 'inherit'}
                startIcon={<Favorite />}
                component={Link}
                to='/home?tab=1'
            >
                {globalize.translate(MetaView.Favorites.Name)}
            </Button>

            {webConfig.menuLinks?.map(link => (
                <Button
                    key={link.name}
                    variant='text'
                    color='inherit'
                    startIcon={<Icon>{link.icon || 'link'}</Icon>}
                    component='a'
                    href={link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    {link.name}
                </Button>
            ))}

            {primaryViews?.map(view => (
                <Button
                    key={view.Id}
                    variant='text'
                    color={(view.Id === currentUserView?.Id) ? 'primary' : 'inherit'}
                    startIcon={<LibraryIcon item={view} />}
                    component={Link}
                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                >
                    {view.Name}
                </Button>
            ))}
            {overflowViews && overflowViews.length > 0 && (
                <>
                    <Button
                        variant='text'
                        color='inherit'
                        endIcon={<ArrowDropDown />}
                        aria-controls={OVERFLOW_MENU_ID}
                        aria-haspopup='true'
                        onClick={onOverflowButtonClick}
                    >
                        {globalize.translate('ButtonMore')}
                    </Button>

                    <UserViewsMenu
                        anchorEl={overflowAnchorEl}
                        id={OVERFLOW_MENU_ID}
                        open={isOverflowMenuOpen}
                        onMenuClose={onOverflowMenuClose}
                        userViews={overflowViews}
                        selectedId={currentUserView?.Id}
                    />
                </>
            )}
        </>
    );
};

export default UserViewNav;
