import React, { FC } from 'react';
import Box from '@mui/material/Box';
import { useGetFavoritesSectionsWithItems } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import SectionContainer from './SectionContainer';
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
    const { isLoading, data: sectionsWithItems } =
        useGetFavoritesSectionsWithItems(parentId, sectionType);

    if (isLoading) {
        return <Loading />;
    }

    if (!sectionsWithItems?.length) {
        return (
            <div className='noItemsMessage centerMessage'>
                <h1>{globalize.translate('MessageNothingHere')}</h1>
                <p>
                    {globalize.translate('MessageNoItemsAvailable')}
                </p>
            </div>
        );
    }

    const getRouteUrl = (section: Section) => {
        let urlForList = '#/list.html?serverId=' + window.ApiClient.serverId();

        if (parentId) {
            urlForList += '&parentId=' + parentId;
        }

        urlForList += '&type=' + section.itemTypes;
        urlForList += '&IsFavorite=true';

        return urlForList;
    };

    return (
        <Box>
            {sectionsWithItems?.map(({ section, items }) => (
                <SectionContainer
                    key={section.type}
                    sectionTitle={globalize.translate(section.name)}
                    items={items ?? []}
                    url={getRouteUrl(section)}
                    cardOptions={{
                        ...section.cardOptions
                    }}
                />
            ))}
        </Box>
    );
};

export default FavoritesSectionView;
