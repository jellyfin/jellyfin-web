import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { LibraryTabContent } from 'types/libraryTabContent';

import defaultViewContent from '../constants/views/defaults';
import viewsByKind from '../constants/views';

export function getViewContent(
    collectionType: CollectionType,
    viewIndex: number
): LibraryTabContent {
    const viewContent = viewsByKind[collectionType][viewIndex];
    return {
        ...defaultViewContent,
        ...viewContent
    };
}
