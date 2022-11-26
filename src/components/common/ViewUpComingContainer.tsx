import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useState } from 'react';
import datetime from '../../scripts/datetime';
import globalize from '../../scripts/globalize';
import SectionContainer from './SectionContainer';

interface ViewUpComingContainerProps {
    topParentId: string | null;
    items: BaseItemDto[];
}

type GroupsArr = {
    name: string;
    items: BaseItemDto[];
}

const ViewUpComingContainer: FC<ViewUpComingContainerProps> = ({ items }) => {
    const [groupsItems, setGroupsItems] = useState<GroupsArr[]>([]);

    const renderUpcoming = useCallback(() => {
        const groups: GroupsArr[] = [];
        let currentGroupName = '';
        let currentGroup: BaseItemDto[] = [];

        for (const item of items) {
            let dateText = '';

            if (item.PremiereDate) {
                try {
                    const premiereDate = datetime.parseISO8601Date(item.PremiereDate, true);
                    dateText = datetime.isRelativeDay(premiereDate, -1) ? globalize.translate('Yesterday') : datetime.toLocaleDateString(premiereDate, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (err) {
                    console.error('error parsing timestamp for upcoming tv shows');
                }
            }

            if (dateText != currentGroupName) {
                if (currentGroup.length) {
                    groups.push({
                        name: currentGroupName,
                        items: currentGroup
                    });
                }

                currentGroupName = dateText;
                currentGroup = [item];
            } else {
                currentGroup.push(item);
            }
        }

        setGroupsItems(groups);
    }, [items]);

    useEffect(() => {
        renderUpcoming();
    }, [renderUpcoming]);

    return (
        <>
            {groupsItems?.map((group, index) => (
                <SectionContainer
                    key={index}
                    sectionTitle={group.name}
                    items={group.items || []}
                    cardOptions={{
                        shape: 'overflowBackdrop',
                        showLocationTypeIndicator: false,
                        showParentTitle: true,
                        preferThumb: true,
                        lazy: true,
                        showDetailsMenu: true,
                        missingIndicator: false,
                        cardLayout: false
                    }}
                />
            ))}
        </>

    );
};

export default ViewUpComingContainer;
