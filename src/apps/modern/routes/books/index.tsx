import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import LibraryPage from 'apps/modern/features/libraries/components/LibraryPage';

const Books: FC = () => {
    return (
        <LibraryPage type={CollectionType.Books} />
    );
};

export default Books;
