import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import LibraryPage from 'apps/experimental/features/libraries/components/LibraryPage';

const LiveTv: FC = () => {
    return (
        <LibraryPage type={CollectionType.Livetv} />
    );
};

export default LiveTv;
