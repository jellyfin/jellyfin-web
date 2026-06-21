import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { getDefaultViewIndex, getViewForIndex, setLastSelectedView } from 'apps/experimental/features/libraries/utils/path';

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
        if (view) setLastSelectedView(view);
    }, [location.pathname, activeTab]);

    return {
        searchParams,
        setSearchParams,
        libraryId,
        activeTab
    };
};

export default useCurrentTab;
