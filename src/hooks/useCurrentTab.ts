import { useLocation } from '@tanstack/react-router';
import { useSearchParams } from './useSearchParams';

import { getDefaultViewIndex } from 'apps/experimental/features/libraries/utils/path';

const useCurrentTab = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchParamsTab = searchParams.get('tab');
    const libraryId = location.pathname === '/livetv' ? 'livetv' : searchParams.get('topParentId');
    const activeTab: number =
        searchParamsTab !== null ? parseInt(searchParamsTab, 10) : getDefaultViewIndex(location.pathname, libraryId);

    return {
        searchParams,
        setSearchParams,
        libraryId,
        activeTab
    };
};

export default useCurrentTab;
