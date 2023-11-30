import { getDefaultTabIndex } from 'apps/experimental/components/tabs/tabRoutes';
import { useLocation, useSearchParams } from 'react-router-dom';

const useCurrentTab = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const searchParamsParentId = searchParams.get('topParentId');
    const searchParamsTab = searchParams.get('tab');
    const currentTabIndex: number =
    searchParamsTab !== null ?
        parseInt(searchParamsTab, 10) :
        getDefaultTabIndex(location.pathname, searchParamsParentId);

    return {
        searchParamsParentId,
        currentTabIndex
    };
};

export default useCurrentTab;
