import React, { FC } from 'react';
import Box from '@mui/material/Box';
import { useGetFavoritesSectionsWithItems } from 'hooks/useFetchItems';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import SectionContainer from 'components/common/SectionContainer';
import { ParentId } from 'types/library';
import { Section, SectionType } from 'types/sections';

interface FavoritesSectionViewProps {
    parentId?: ParentId;
    sectionType?: SectionType[];
}

const FavoritesSectionView: FC<FavoritesSectionViewProps> = ({
    parentId,
    sectionType
}) => {
    const { isLoading, data: sectionsWithItems, refetch } =
        useGetFavoritesSectionsWithItems(parentId, sectionType);

    if (isLoading) {
        return <Loading />;
    }

    if (!sectionsWithItems?.length) {
        return <NoItemsMessage message='MessageNoFavoritesAvailable' />;
    }

    const getRouteUrl = (section: Section) => {
        return appRouter.getRouteUrl('list', {
            serverId: window.ApiClient.serverId(),
            parentId: parentId,
            itemTypes: section.itemTypes,
            isFavorite: true
        });
    };

    return (
        <Box>
            {sectionsWithItems?.map(({ section, items }) => (
                <SectionContainer
                    key={section.type}
                    sectionHeaderProps={{
                        title: globalize.translate(section.name),
                        url: getRouteUrl(section)
                    }}
                    itemsContainerProps={{
                        queryKey: ['FavoriteSectionWithItems'],
                        reloadItems: refetch
                    }}
                    items={items ?? []}
                    cardOptions={{
                        ...section.cardOptions,
                        queryKey: ['FavoriteSectionWithItems']
                    }}
                />
            ))}
        </Box>
    );
};

export default FavoritesSectionView;
