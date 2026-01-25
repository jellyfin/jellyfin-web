import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ChevronDownIcon, HeartFilledIcon } from '@radix-ui/react-icons';
import React, { useMemo, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useSearchParams } from 'hooks/useSearchParams';
import { Button } from 'ui-primitives/Button';
import useMediaQuery from 'hooks/useMediaQuery';
import { vars } from 'styles/tokens.css';

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
    const [searchParams] = useSearchParams();
    const libraryId = searchParams.get('topParentId') || searchParams.get('parentId');
    const collectionType = searchParams.get('collectionType');
    const { activeTab } = useCurrentTab();
    const webConfig = useWebConfig();

    const isExtraLargeScreen = useMediaQuery('(min-width: 1920px)');
    const isLargeScreen = useMediaQuery('(min-width: 1280px)');
    const maxViews = useMemo(() => {
        let _maxViews = MAX_USER_VIEWS_MD;
        if (isExtraLargeScreen) _maxViews = MAX_USER_VIEWS_XL;
        else if (isLargeScreen) _maxViews = MAX_USER_VIEWS_LG;

        const customLinks = (webConfig.menuLinks || []).length;

        return _maxViews - customLinks;
    }, [isExtraLargeScreen, isLargeScreen, webConfig.menuLinks]);

    const { user } = useApi();
    const { data: userViews, isPending } = useUserViews(user?.Id);

    const primaryViews = useMemo(() => userViews?.Items?.slice(0, maxViews), [maxViews, userViews]);

    const overflowViews = useMemo(() => userViews?.Items?.slice(maxViews), [maxViews, userViews]);

    const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);

    const currentUserView = useMemo(
        () => getCurrentUserView(userViews?.Items, location.pathname, libraryId, collectionType, activeTab),
        [activeTab, collectionType, libraryId, location.pathname, userViews]
    );

    if (isPending) return null;

    return (
        <>
            <Button
                variant="plain"
                startIcon={<HeartFilledIcon />}
                component={Link}
                to="/home?tab=1"
                style={{
                    color: currentUserView?.Id === MetaView.Favorites.Id ? vars.colors.primary : 'inherit'
                }}
            >
                {globalize.translate(MetaView.Favorites.Name || '')}
            </Button>

            {webConfig.menuLinks?.map(link => (
                <Button
                    key={link.name}
                    variant="plain"
                    startIcon={
                        <span className="material-icons" aria-hidden="true">
                            {link.icon || 'link'}
                        </span>
                    }
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {link.name}
                </Button>
            ))}

            {primaryViews?.map(view => (
                <Button
                    key={view.Id}
                    variant="plain"
                    startIcon={<LibraryIcon item={view} />}
                    component={Link}
                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                    style={{
                        color: view.Id === currentUserView?.Id ? vars.colors.primary : 'inherit'
                    }}
                >
                    {view.Name}
                </Button>
            ))}
            {overflowViews && overflowViews.length > 0 && (
                <UserViewsMenu
                    open={isOverflowMenuOpen}
                    onOpenChange={setIsOverflowMenuOpen}
                    trigger={
                        <Button
                            variant="plain"
                            endIcon={<ChevronDownIcon />}
                            aria-controls={OVERFLOW_MENU_ID}
                            aria-haspopup="true"
                        >
                            {globalize.translate('ButtonMore')}
                        </Button>
                    }
                    userViews={overflowViews}
                    selectedId={currentUserView?.Id}
                />
            )}
        </>
    );
};

export default UserViewNav;
