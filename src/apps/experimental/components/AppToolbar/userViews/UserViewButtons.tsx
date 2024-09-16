import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import LibraryIcon from 'apps/experimental/components/LibraryIcon';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import { useRecordingFolders } from 'hooks/useRecordingFolders';
import { useUserViews } from 'hooks/useUserViews';

import { GroupType, ViewGroup } from './types';
import { getGroupIcon, getGroupType } from './utils';
import ViewGroupMenuButton from './ViewGroupMenuButton';
import { Button } from '@mui/material';

const UserViewButtons = () => {
    const { user } = useApi();
    const { data: userViews } = useUserViews(user?.Id);
    const { data: recordingFolders } = useRecordingFolders();

    const viewGroups = useMemo(() => {
        const viewItems: BaseItemDto[] = userViews?.Items || [];
        const groupOverrides = recordingFolders?.Items?.reduce<Record<string, GroupType>>((acc, folder) => {
            if (folder.Id) acc[folder.Id] = GroupType.LiveTv;
            return acc;
        }, {}) || {};
        const viewsByGroup = viewItems.reduce<Partial<Record<GroupType, BaseItemDto[]>>>((acc, view) => {
            const type = getGroupType(view, groupOverrides);
            return {
                ...acc,
                [type]: [
                    ...(acc[type] || []),
                    view
                ]
            };
        }, {});

        const addedTypes: GroupType[] = [];
        const groupedViews: ViewGroup[] = [];
        viewItems.forEach(view => {
            const type = getGroupType(view, groupOverrides);

            if (type === GroupType.Other) {
                groupedViews.push({
                    type,
                    icon: <LibraryIcon item={view} />,
                    views: [ view ]
                });
            } else if (!addedTypes.includes(type)) {
                addedTypes.push(type);
                groupedViews.push({
                    type,
                    icon: getGroupIcon(type),
                    views: viewsByGroup[type] || []
                });
            }
        });

        return groupedViews;
    }, [ recordingFolders, userViews ]);

    console.debug('[AppToolbar] views', viewGroups);

    return viewGroups.map((viewGroup) => {
        if (!viewGroup.views?.length) return null;

        if (viewGroup.views.length === 1) {
            const view = viewGroup.views[0];
            const title = view.Name || undefined;

            return (
                // <Tooltip key={view.Id} title={title}>
                //     <IconButton
                //         size='large'
                //         aria-label={title}
                //         color='inherit'
                //         component={Link}
                //         to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                //     >
                //         {viewGroup.icon}
                //     </IconButton>
                // </Tooltip>
                <Button
                    key={view.Id}
                    variant='text'
                    color='inherit'
                    startIcon={viewGroup.icon}
                    component={Link}
                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                >
                    {title}
                </Button>
            );
        }

        return (
            <ViewGroupMenuButton key={viewGroup.type} viewGroup={viewGroup} />
        );
    });
};

export default UserViewButtons;
