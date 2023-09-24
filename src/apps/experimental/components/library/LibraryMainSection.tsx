import React, { FC } from 'react';

import { useLibrarySettings } from 'hooks/useLibrarySettings';
import SuggestionsView from './SuggestionsView';
import UpComingView from './UpComingView';
import GenresView from './GenresView';
import ItemsView from './ItemsView';

import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from 'types/collectionType';
import { ParentId } from 'types/library';

interface LibraryMainSectionProps {
    collectionType?: CollectionType;
    parentId?: ParentId;
}

const LibraryMainSection: FC<LibraryMainSectionProps> = () => {
    const { viewType } = useLibrarySettings();

    if (viewType === LibraryTab.Suggestions) return <SuggestionsView />;

    if (viewType === LibraryTab.Upcoming) return <UpComingView />;

    if (viewType === LibraryTab.Genres) return <GenresView />;

    return <ItemsView viewType={viewType} />;
};

export default LibraryMainSection;
