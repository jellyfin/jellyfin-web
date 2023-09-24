import React, { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as userSettings from 'scripts/settings/userSettings';
import Loading from 'components/loading/LoadingComponent';
import { useGetItem } from 'hooks/useFetchItems';
import { LibrarySettingsProvider } from 'hooks/useLibrarySettings';
import LibraryHeaderSection from 'apps/experimental/components/library/LibraryHeaderSection';
import LibraryMainSection from 'apps/experimental/components/library/LibraryMainSection';

import { LibraryTab } from 'types/libraryTab';

const Library: FC = () => {
    const [searchParams] = useSearchParams();
    const parentId = searchParams.get('topParentId');
    const defaultView = userSettings.get('landing-' + parentId, false) as LibraryTab;
    const { isLoading, data: item } = useGetItem(parentId);

    if (isLoading) return <Loading />;

    return (
        <LibrarySettingsProvider
            key={`LibrarySettingsKey - ${item?.Id}`}
            defaultView={defaultView}
            item={item}
        >

            <LibraryHeaderSection />

            <LibraryMainSection />

        </LibrarySettingsProvider>
    );
};

export default Library;
