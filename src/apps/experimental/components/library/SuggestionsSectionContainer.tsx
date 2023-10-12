import React, { FC } from 'react';
import { useGetItemsBySectionType } from 'hooks/useFetchItems';
import globalize from 'scripts/globalize';

import Loading from 'components/loading/LoadingComponent';
import { appRouter } from 'components/router/appRouter';
import SectionContainer from './SectionContainer';

import { Sections } from 'types/suggestionsSections';
import { ParentId } from 'types/library';

interface SuggestionsSectionContainerProps {
    parentId: ParentId;
    section: Sections;
}

const SuggestionsSectionContainer: FC<SuggestionsSectionContainerProps> = ({
    parentId,
    section
}) => {
    const getRouteUrl = () => {
        return appRouter.getRouteUrl('list', {
            serverId: window.ApiClient.serverId(),
            itemTypes: section.type,
            parentId: parentId
        });
    };

    const { isLoading, data: items } = useGetItemsBySectionType(
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
                ...section.cardOptions
            }}
        />
    );
};

export default SuggestionsSectionContainer;
