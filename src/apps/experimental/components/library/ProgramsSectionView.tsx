import React, { type FC } from 'react';

import NoItemsMessage from '@/components/common/NoItemsMessage';
import SectionContainer from '@/components/common/SectionContainer';
import Loading from '@/components/loading/LoadingComponent';
import { appRouter } from '@/components/router/appRouter';
import { ItemAction } from '@/constants/itemAction';
import { useApi } from '@/hooks/useApi';
import { useGetProgramsSectionsWithItems, useGetTimers } from '@/hooks/useFetchItems';
import globalize from '@/lib/globalize';
import type { ParentId } from '@/types/library';
import type { Section, SectionType } from '@/types/sections';
import { CardShape } from '@/utils/card';

interface ProgramsSectionViewProps {
    parentId: ParentId;
    sectionType: SectionType[];
    isUpcomingRecordingsEnabled: boolean | undefined
}

const ProgramsSectionView: FC<ProgramsSectionViewProps> = ({
    parentId,
    sectionType,
    isUpcomingRecordingsEnabled = false
}) => {
    const { __legacyApiClient__ } = useApi();
    const { isLoading, data: sectionsWithItems, refetch } = useGetProgramsSectionsWithItems(parentId, sectionType);
    const {
        isLoading: isUpcomingRecordingsLoading,
        data: upcomingRecordings
    } = useGetTimers(isUpcomingRecordingsEnabled);

    if (isLoading || isUpcomingRecordingsLoading) {
        return <Loading />;
    }

    if (!sectionsWithItems?.length && !upcomingRecordings?.length) {
        return <NoItemsMessage />;
    }

    const getRouteUrl = (section: Section) => {
        return appRouter.getRouteUrl('list', {
            serverId: window.ApiClient.serverId(),
            itemTypes: section.itemTypes,
            isAiring: section.parametersOptions?.isAiring,
            isMovie: section.parametersOptions?.isMovie,
            isSports: section.parametersOptions?.isSports,
            isKids: section.parametersOptions?.isKids,
            isNews: section.parametersOptions?.isNews,
            isSeries: section.parametersOptions?.isSeries
        });
    };

    return (
        <>
            {sectionsWithItems?.map(({ section, items }) => (
                <SectionContainer
                    key={section.type}
                    sectionHeaderProps={{
                        title: globalize.translate(section.name),
                        url: getRouteUrl(section)
                    }}
                    itemsContainerProps={{
                        queryKey: ['ProgramSectionWithItems'],
                        reloadItems: refetch
                    }}
                    items={items}
                    cardOptions={{
                        ...section.cardOptions,
                        queryKey: ['ProgramSectionWithItems'],
                        serverId: __legacyApiClient__?.serverId()
                    }}
                />
            ))}

            {upcomingRecordings?.map((group) => (
                <SectionContainer
                    key={group.name}
                    sectionHeaderProps={{
                        title: group.name
                    }}
                    itemsContainerProps={{
                        queryKey: ['Timers'],
                        reloadItems: refetch
                    }}
                    items={group.timerInfo}
                    cardOptions={{
                        queryKey: ['Timers'],
                        shape: CardShape.BackdropOverflow,
                        showTitle: true,
                        showParentTitleOrTitle: true,
                        showAirTime: true,
                        showAirEndTime: true,
                        showChannelName: false,
                        cardLayout: true,
                        centerText: false,
                        action: ItemAction.Edit,
                        cardFooterAside: 'none',
                        preferThumb: true,
                        coverImage: true,
                        allowBottomPadding: false,
                        overlayText: false,
                        showChannelLogo: true,
                        serverId: __legacyApiClient__?.serverId()
                    }}
                />
            ))}
        </>
    );
};

export default ProgramsSectionView;
