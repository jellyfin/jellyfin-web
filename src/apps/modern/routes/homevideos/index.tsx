import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import LibraryPage from 'apps/modern/features/libraries/components/LibraryPage';

const HomeVideos: FC = () => {
    return (
        <LibraryPage type={CollectionType.Homevideos} />
    );
};

export default HomeVideos;
