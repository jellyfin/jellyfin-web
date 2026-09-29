import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Favorite from '@mui/icons-material/Favorite';
import Button from '@mui/material/Button/Button';
import Icon from '@mui/material/Icon';
import { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import LibraryIcon from 'apps/modern/components/LibraryIcon';
import { MetaView } from 'apps/modern/constants/metaView';
import { useAncestors } from 'apps/modern/features/libraries/hooks/api/useAncestors';
import { isDetailsPath, isLibraryPath } from 'apps/modern/features/libraries/utils/path';
import { appRouter } from 'components/router/appRouter';
import { useUserViews } from 'hooks/api/useUserViews';
import { useApi } from 'hooks/useApi';
import useCurrentTab from 'hooks/useCurrentTab';
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
    const isUserViewPath = isDetailsPath(pathname) || isLibraryPath(pathname) || [HOME_PATH, LIST_PATH].includes(pathname);
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
    const itemId = searchParams.get('id') || undefined;
    const libraryId = searchParams.get('topParentId') || searchParams.get('parentId');
    const collectionType = searchParams.get('collectionType');
    const { activeTab } = useCurrentTab();
    const { menuLinks } = useWebConfig();

    const isExtraLargeScreen = useMediaQuery((t: Theme) => t.breakpoints.up('xl'));
    const isLargeScreen = useMediaQuery((t: Theme) => t.breakpoints.up('lg'));
    const maxViews = useMemo(() => {
        if (isExtraLargeScreen) return MAX_USER_VIEWS_XL;
        if (isLargeScreen) return MAX_USER_VIEWS_LG;
        return MAX_USER_VIEWS_MD;
    }, [ isExtraLargeScreen, isLargeScreen ]);

    const { user } = useApi();
    const {
        data: userViews,
        isPending
    } = useUserViews({ userId: user?.Id });

    const navItems = useMemo(() => [
        ...(menuLinks || []),
        ...(userViews?.Items || [])
    ], [ menuLinks, userViews ]);

    const {
        data: ancestors
    } = useAncestors({ itemId });

    const ancestorLibraryId = useMemo(() => {
        return ancestors?.find(ancestor => ancestor.Type === BaseItemKind.CollectionFolder)?.Id || null;
    }, [ ancestors ]);

    const primaryNavItems = useMemo(() => {
        // If the number of nav items exceeds the max + 1, we put the excess items in the overflow menu.
        // We add 1 to prevent the overflow menu from showing only one item.
        if (navItems.length > maxViews + 1) {
            return navItems.slice(0, maxViews);
        }

        return navItems;
    }, [maxViews, navItems]);

    const overflowNavItems = useMemo(() => (
        navItems.slice(primaryNavItems?.length || 0)
    ), [ primaryNavItems, navItems ]);

    const [ overflowAnchorEl, setOverflowAnchorEl ] = useState<null | HTMLElement>(null);
    const isOverflowMenuOpen = Boolean(overflowAnchorEl);

    const onOverflowButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setOverflowAnchorEl(event.currentTarget);
    }, []);

    const onOverflowMenuClose = useCallback(() => {
        setOverflowAnchorEl(null);
    }, []);

    const currentUserView = useMemo(() => (
        getCurrentUserView(userViews?.Items, location.pathname, libraryId || ancestorLibraryId, collectionType, activeTab)
    ), [ activeTab, collectionType, libraryId, ancestorLibraryId, location.pathname, userViews ]);

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

            {primaryNavItems?.map(navItem => {
                if ('url' in navItem) {
                    return (
                        <Button
                            key={navItem.name}
                            variant='text'
                            color='inherit'
                            startIcon={<Icon>{navItem.icon || 'link'}</Icon>}
                            component='a'
                            href={navItem.url}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            {navItem.name}
                        </Button>
                    );
                }

                return (
                    <Button
                        key={navItem.Id}
                        variant='text'
                        color={(navItem.Id === currentUserView?.Id) ? 'primary' : 'inherit'}
                        startIcon={<LibraryIcon item={navItem} />}
                        component={Link}
                        to={appRouter.getRouteUrl(navItem, { context: navItem.CollectionType }).substring(1)}
                    >
                        {navItem.Name}
                    </Button>
                );
            })}

            {overflowNavItems && overflowNavItems.length > 0 && (
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
                        userViews={overflowNavItems}
                        selectedId={currentUserView?.Id}
                    />
                </>
            )}
        </>
    );
};

export default UserViewNav;
