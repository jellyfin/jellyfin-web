import { getDefaultTabIndex } from 'apps/experimental/components/tabs/tabRoutes';
import { useLocation, useSearchParams } from 'react-router-dom';

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
            getDefaultTabIndex(location.pathname, libraryId);

    return {
        searchParams,
        setSearchParams,
        libraryId,
        activeTab
    };
};

export default useCurrentTab;
