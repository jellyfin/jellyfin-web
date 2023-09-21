import React, { FC } from 'react';
import SectionContainer from './SectionContainer';
import globalize from 'scripts/globalize';
import Loading from 'components/loading/LoadingComponent';
import { appRouter } from 'components/router/appRouter';
import { Sections } from 'types/suggestionsSections';
import { useGetItemsByFavoriteType } from 'hooks/useFetchItems';

interface FavoritesSectionContainerProps {
    parentId?: string | null;
    section: Sections;
}

const FavoritesSectionContainer: FC<FavoritesSectionContainerProps> = ({
    parentId,
    section
}) => {
    const getRouteUrl = () => {
        return appRouter.getRouteUrl('list', {
            serverId: window.ApiClient.serverId(),
            itemTypes: section.type,
            isFavorite: true
        });
    };

    const { isLoading, data: items } = useGetItemsByFavoriteType(
        section,
        parentId
    );

    if (isLoading) {
        return <Loading />;
    }

    return (
        <SectionContainer
            sectionTitle={globalize.translate(section.name)}
            items={items ?? []}
            url={getRouteUrl()}
            cardOptions={{
                ...section.cardOptions,
                overlayText: section.cardOptions.overlayText !== false,
                scalable: true,
                cardLayout: false
            }}
        />
    );
};

export default FavoritesSectionContainer;
