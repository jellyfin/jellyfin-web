import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC } from 'react';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import Box from '@mui/material/Box';

import useIndicator from 'components/indicators/useIndicator';
import { ItemAction } from 'constants/itemAction';

import PrimaryMediaInfo from '../../mediainfo/PrimaryMediaInfo';
import ListContentWrapper from './ListContentWrapper';
import ListItemBody from './ListItemBody';
import ListImageContainer from './ListImageContainer';
import ListViewUserDataButtons from './ListViewUserDataButtons';

import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';

interface ListContentProps {
    item: ItemDto;
    listOptions: ListOptions;
    enableContentWrapper?: boolean;
    enableOverview?: boolean;
    enableSideMediaInfo?: boolean;
    clickEntireItem?: boolean;
    action?: ItemAction;
    isLargeStyle: boolean;
    downloadWidth?: number;
}

const ListContent: FC<ListContentProps> = ({
    item,
    listOptions,
    enableContentWrapper,
    enableOverview,
    enableSideMediaInfo,
    clickEntireItem,
    action,
    isLargeStyle,
    downloadWidth
}) => {
    const indicator = useIndicator(item);
    return (
        <ListContentWrapper
            itemOverview={item.Overview}
            enableContentWrapper={enableContentWrapper}
            enableOverview={enableOverview}
        >

            {!clickEntireItem && listOptions.dragHandle && (
                <DragHandleIcon className='listViewDragHandle listItemIcon listItemIcon-transparent' />
            )}

            {listOptions.image !== false && (
                <ListImageContainer
                    item={item}
                    listOptions={listOptions}
                    action={action}
                    isLargeStyle={isLargeStyle}
                    clickEntireItem={clickEntireItem}
                    downloadWidth={downloadWidth}
                />
            )}

            {listOptions.showIndexNumberLeft && (
                <Box className='listItem-indexnumberleft'>
                    {item.IndexNumber ?? <span>&nbsp;</span>}
                </Box>
            )}

            <ListItemBody
                item={item}
                listOptions={listOptions}
                action={action}
                enableContentWrapper={enableContentWrapper}
                enableOverview={enableOverview}
                enableSideMediaInfo={enableSideMediaInfo}
                getMissingIndicator={indicator.getMissingIndicator}
            />

            {listOptions.showMediaInfo !== false && enableSideMediaInfo && (
                <PrimaryMediaInfo
                    className='secondary listItemMediaInfo'
                    infoclass='mediaInfoText'
                    item={item}
                    showRuntimeInfo
                    showOfficialRatingInfo
                    showOriginalAirDateInfo
                    showStarRatingInfo
                    showCaptionIndicatorInfo
                    getMissingIndicator={indicator.getMissingIndicator}
                />
            )}

            {listOptions.recordButton
                && (item.Type === 'Timer' || item.Type === BaseItemKind.Program) && (
                indicator.getTimerIndicator('listItemAside')
            )}

            {!clickEntireItem && (
                <ListViewUserDataButtons
                    item={item}
                    listOptions={listOptions}
                />
            )}
        </ListContentWrapper>
    );
};

export default ListContent;
