import NoItemsMessage from 'components/common/NoItemsMessage';
import SectionContainer from 'components/common/SectionContainer';
import Loading from 'components/loading/LoadingComponent';
import { useApi } from 'hooks/useApi';
import { useGetGroupsUpcomingEpisodes } from 'hooks/useFetchItems';
import React, { type FC } from 'react';
import type { LibraryViewProps } from 'types/library';
import { CardShape } from 'utils/card';

// eslint-disable-next-line sonarjs/function-return-type
const UpcomingView: FC<LibraryViewProps> = ({ parentId }) => {
    const { __legacyApiClient__ } = useApi();
    const { isLoading, data: groupsUpcomingEpisodes } = useGetGroupsUpcomingEpisodes(parentId);

    if (isLoading) return <Loading />;

    if (!groupsUpcomingEpisodes?.length) {
        return <NoItemsMessage message="MessagePleaseEnsureInternetMetadata" />;
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
                queryKey: ['GroupsUpcomingEpisodes'],
                serverId: __legacyApiClient__?.serverId()
            }}
        />
    ));
};

export default UpcomingView;
