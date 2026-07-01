import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { getCollectionTypeForPath, getDefaultViewIndex, getViewForIndex, setLastSelectedView } from 'apps/modern/features/libraries/utils/path';
import { LibraryTab } from 'types/libraryTab';

const useCurrentTab = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchParamsTab = searchParams.get('tab');
    const libraryId =
        location.pathname === '/livetv' ?
            'livetv' :
            searchParams.get('topParentId');
    const activeTab: number =
        searchParamsTab !== null ?
            parseInt(searchParamsTab, 10) :
            getDefaultViewIndex(location.pathname, libraryId);

    // Remember the selected view so that switching between libraries preserves the active
    // selector (falling back to the library default when that selector isn't available).
    useEffect(() => {
        const view = getViewForIndex(location.pathname, activeTab);
        const collectionType = getCollectionTypeForPath(location.pathname);
        // The dedicated Playlists and Collections libraries have those views as their own
        // default. Merely visiting them shouldn't stick every other library on its
        // Playlists/Collections tab, so don't remember them here.
        const isVirtualCollectionDefault =
            (view === LibraryTab.Playlists && collectionType === CollectionType.Playlists)
            || (view === LibraryTab.Collections && collectionType === CollectionType.Boxsets);
        if (view && !isVirtualCollectionDefault) {
            setLastSelectedView(view);
        }
    }, [location.pathname, activeTab]);

    return {
        searchParams,
        setSearchParams,
        libraryId,
        activeTab
    };
};

export default useCurrentTab;
