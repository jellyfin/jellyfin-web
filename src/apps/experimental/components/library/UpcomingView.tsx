import React, { type FC } from 'react';
import { useGetGroupsUpcomingEpisodes } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import SectionContainer from 'components/common/SectionContainer';
import { CardShape } from 'utils/card';
import type { LibraryViewProps } from 'types/library';

const UpcomingView: FC<LibraryViewProps> = ({ parentId }) => {
    const { isLoading, data: groupsUpcomingEpisodes } =
        useGetGroupsUpcomingEpisodes(parentId);

    if (isLoading) return <Loading />;

    if (!groupsUpcomingEpisodes?.length) {
        return <NoItemsMessage message='MessagePleaseEnsureInternetMetadata' />;
    }

    return groupsUpcomingEpisodes?.map((group) => (
        <SectionContainer
            key={group.name}
            sectionHeaderProps={{
                title: group.name
            }}
            itemsContainerProps={{
                queryKey: ['GroupsUpcomingEpisodes']
            }}
            items={group.items}
            cardOptions={{
                shape: CardShape.BackdropOverflow,
                showLocationTypeIndicator: false,
                showParentTitle: true,
                preferThumb: true,
                lazy: true,
                showDetailsMenu: true,
                missingIndicator: false,
                cardLayout: false,
                queryKey: ['GroupsUpcomingEpisodes']
            }}
        />
    ));
};

export default UpcomingView;
