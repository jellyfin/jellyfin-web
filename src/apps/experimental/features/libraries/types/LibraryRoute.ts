import { LibraryTab } from 'types/libraryTab';

interface LibraryViewDefinition {
    index: number;
    label: string;
    view: LibraryTab;
    isDefault?: boolean;
}

export interface LibraryRoute {
    path: string;
    views: LibraryViewDefinition[];
}
