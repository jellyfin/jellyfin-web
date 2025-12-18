import React, { type FC } from 'react';

import { useApi } from '@/hooks/useApi';
import { useGetGroupsUpcomingEpisodes } from '@/hooks/useFetchItems';
import Loading from '@/components/loading/LoadingComponent';
import NoItemsMessage from '@/components/common/NoItemsMessage';
import SectionContainer from '@/components/common/SectionContainer';
import { CardShape } from '@/utils/card';
import type { LibraryViewProps } from '@/types/library';

const UpcomingView: FC<LibraryViewProps> = ({ parentId }) => {
    const { __legacyApiClient__ } = useApi();
    const { isLoading, data: groupsUpcomingEpisodes } =
        useGetGroupsUpcomingEpisodes(parentId);

    let content: React.ReactNode = null;

    if (isLoading) {
        content = <Loading />;
    } else if (!groupsUpcomingEpisodes?.length) {
        content = <NoItemsMessage message='MessagePleaseEnsureInternetMetadata' />;
    } else {
        content = groupsUpcomingEpisodes.map((group) => (
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
    }

    return content;
};

export default UpcomingView;
