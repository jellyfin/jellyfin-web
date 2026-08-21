import { useLocation, useSearchParams } from 'react-router-dom';

import { getDefaultViewIndex } from 'apps/modern/features/libraries/utils/path';

const useCurrentTab = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchParamsTab = searchParams.get('tab');
    const libraryId = searchParams.get('topParentId');
    const settingsKey = location.pathname === '/livetv' ? 'livetv' : libraryId;
    const activeTab: number =
        searchParamsTab !== null ?
            parseInt(searchParamsTab, 10) :
            getDefaultViewIndex(location.pathname, settingsKey);

    return {
        searchParams,
        setSearchParams,
        libraryId,
        settingsKey,
        activeTab
    };
};

export default useCurrentTab;
