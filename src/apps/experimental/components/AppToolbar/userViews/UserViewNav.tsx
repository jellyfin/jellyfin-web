import { Button, Menu, MenuItem } from '@mui/material';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import React, { useCallback, useMemo, useState } from 'react';
import LibraryIcon from '../../LibraryIcon';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRouter } from 'components/router/appRouter';
import { ArrowDropDown, Favorite } from '@mui/icons-material';
import TabRoutes, { isTabPath } from '../../tabs/tabRoutes';
import { BaseItemDto, CollectionType } from '@jellyfin/sdk/lib/generated-client';
import UserViewsMenu from './UserViewsMenu';
import useCurrentTab from 'hooks/useCurrentTab';
import globalize from 'lib/globalize';

// TODO: Vary this based on screen size
const MAX_USER_VIEWS = 5;
const ALL_VIEWS_MENU_ID = 'user-views-all-menu';
const OVERFLOW_MENU_ID = 'user-view-overflow-menu';
const TABS_MENU_ID = 'user-view-tabs-menu';

const HOME_PATH = '/home.html';
const LIST_PATH = '/list.html';

const getCurrentUserView = (
    userViews: BaseItemDto[] | undefined,
    pathname: string,
    libraryId: string | null,
    collectionType: string | null,
    tab: number
) => {
    const isUserViewPath = isTabPath(pathname) || [HOME_PATH, LIST_PATH].includes(pathname);
    if (!isUserViewPath) return undefined;

    if (collectionType === CollectionType.Livetv) {
        return userViews?.find(({ CollectionType: type }) => type === CollectionType.Livetv);
    }

    if (pathname === HOME_PATH && tab === 1) {
        return {
            Id: 'favorites',
            Name: globalize.translate('Favorites')
        } as BaseItemDto;
    }

    // eslint-disable-next-line sonarjs/different-types-comparison
    return userViews?.find(({ Id: id }) => id === libraryId);
};

const UserViewNav = () => {
    const location = useLocation();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const libraryId = searchParams.get('topParentId') || searchParams.get('parentId');
    const collectionType = searchParams.get('collectionType');
    const { activeTab } = useCurrentTab();

    const { user } = useApi();
    const { data: userViews } = useUserViews(user?.Id);

    const primaryViews = useMemo(() => (
        userViews?.Items?.slice(0, MAX_USER_VIEWS)
    ), [ userViews ]);

    const overflowViews = useMemo(() => (
        userViews?.Items?.slice(MAX_USER_VIEWS)
    ), [ userViews ]);

    const [ allViewsAnchorEl, setAllViewsAnchorEl ] = useState<null | HTMLElement>(null);
    const isAllViewsMenuOpen = Boolean(allViewsAnchorEl);

    const onAllViewsButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAllViewsAnchorEl(event.currentTarget);
    }, []);

    const onAllViewsMenuClose = useCallback(() => {
        setAllViewsAnchorEl(null);
    }, []);

    const [ tabsAnchorEl, setTabsAnchorEl ] = useState<null | HTMLElement>(null);
    const isTabsMenuOpen = Boolean(tabsAnchorEl);

    const onTabsButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setTabsAnchorEl(event.currentTarget);
    }, []);

    const onTabsMenuClose = useCallback(() => {
        setTabsAnchorEl(null);
    }, []);

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
    const currentTabRoute = TabRoutes.find(({ path }) => path === location.pathname);
    const currentTab = currentTabRoute?.tabs.find(({ index }) => index === activeTab);

    if (currentUserView) {
        return (
            <>
                <Button
                    variant='text'
                    color='inherit'
                    startIcon={<LibraryIcon item={currentUserView} />}
                    endIcon={<ArrowDropDown />}
                    // FIXME: Add label
                    aria-label={''}
                    aria-controls={ALL_VIEWS_MENU_ID}
                    aria-haspopup='true'
                    onClick={onAllViewsButtonClick}
                >
                    {currentUserView?.Name}
                </Button>

                <UserViewsMenu
                    anchorEl={allViewsAnchorEl}
                    id={ALL_VIEWS_MENU_ID}
                    open={isAllViewsMenuOpen}
                    onMenuClose={onAllViewsMenuClose}
                    userViews={userViews?.Items || []}
                    selectedId={currentUserView.Id}
                    includeGlobalViews
                />

                {currentTab && (
                    <>
                        <Button
                            variant='text'
                            color='inherit'
                            endIcon={<ArrowDropDown />}
                            // FIXME: Add label
                            aria-label={''}
                            aria-controls={TABS_MENU_ID}
                            aria-haspopup='true'
                            onClick={onTabsButtonClick}
                        >
                            {globalize.translate(currentTab.label)}
                        </Button>

                        <Menu
                            anchorEl={tabsAnchorEl}
                            id={TABS_MENU_ID}
                            keepMounted
                            open={isTabsMenuOpen}
                            onClose={onTabsMenuClose}
                        >
                            {currentTabRoute?.tabs.map(tab => (
                                <MenuItem
                                    key={tab.value}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => {
                                        searchParams.set('tab', `${tab.index}`);
                                        setSearchParams(searchParams);
                                        onTabsMenuClose();
                                    }}
                                    selected={tab.index === currentTab.index}
                                >
                                    {globalize.translate(tab.label)}
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                )}
            </>
        );
    }

    return (
        <>
            <Button
                variant='text'
                color='inherit'
                startIcon={<Favorite />}
                component={Link}
                to='/home.html?tab=1'
            >
                {globalize.translate('Favorites')}
            </Button>

            {primaryViews?.map(view => (
                <Button
                    key={view.Id}
                    variant='text'
                    color='inherit'
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
                        // FIXME: Add label
                        aria-label={''}
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
                    />
                </>
            )}
        </>
    );
};

export default UserViewNav;
