import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTab } from 'types/libraryTab';

interface LibraryViewDefinition {
    index: number
    label: string
    view: LibraryTab
    isDefault?: boolean
}

export interface LibraryRoute {
    path: string,
    type: CollectionType,
    views: LibraryViewDefinition[]
}
