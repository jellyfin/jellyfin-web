import React, { type FC } from 'react';
import {
    useGetCollectionItemsByType
} from '../../api/useGetCollectionItemsByType';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'lib/globalize';
import SectionContainer from 'components/common/SectionContainer';

interface CollectionItemsProps {
    itemId: string;
}

const CollectionItems: FC<CollectionItemsProps> = ({ itemId }) => {
    const {
        isLoading,
        data: sectionsWithItems,
        refetch
    } = useGetCollectionItemsByType(itemId);

    if (isLoading) return <Loading />;

    if (!sectionsWithItems?.length) return null;

    return (
        <>
            {sectionsWithItems.map((section) => (
                <SectionContainer
                    key={section.title}
                    noPadding
                    sectionHeaderProps={{
                        title: globalize.translate(section.title)
                    }}
                    itemsContainerProps={{
                        queryKey: ['CollectionItemsByType'],
                        reloadItems: refetch
                    }}
                    items={section.items}
                    cardOptions={{
                        showTitle: true,
                        centerText: true,
                        lazy: true,
                        showDetailsMenu: true,
                        overlayMoreButton: true,
                        collectionId: itemId,
                        ...section.cardOptions
                    }}
                />
            ))}
        </>
    );
};

export default CollectionItems;
