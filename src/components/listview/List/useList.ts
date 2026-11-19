import classNames from 'classnames';

import layoutManager from 'components/layoutManager';
import { ItemAction } from 'constants/itemAction';
import { getDataAttributes } from 'utils/items';

import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';

interface UseListProps {
    item: ItemDto;
    listOptions: ListOptions;
}

function useList({ item, listOptions }: UseListProps) {
    const action = listOptions.action ?? ItemAction.Link;
    const isLargeStyle = listOptions.imageSize === 'large';
    const enableOverview = listOptions.enableOverview;
    const clickEntireItem = !!layoutManager.tv;
    const enableSideMediaInfo = listOptions.enableSideMediaInfo ?? true;
    const enableContentWrapper =
        listOptions.enableOverview && !layoutManager.tv;
    const downloadWidth = isLargeStyle ? 500 : 80;

    const dataAttributes = getDataAttributes(
        {
            action,
            itemServerId: item.ServerId,
            itemId: item.Id,
            collectionId: listOptions.collectionId,
            playlistId: listOptions.playlistId,
            itemChannelId: item.ChannelId,
            itemType: item.Type,
            itemMediaType: item.MediaType,
            itemCollectionType: item.CollectionType,
            itemIsFolder: item.IsFolder,
            itemPlaylistItemId: item.PlaylistItemId
        }
    );

    const listWrapperClass = classNames(
        'listItem',
        {
            'listItem-border':
                listOptions.border
                ?? (listOptions.highlight !== false && !layoutManager.tv)
        },
        { 'itemAction listItem-button': clickEntireItem },
        { 'listItem-focusscale': layoutManager.tv },
        { 'listItem-largeImage': isLargeStyle },
        { 'listItem-withContentWrapper': enableContentWrapper }
    );

    const getListdWrapperProps = () => ({
        className: listWrapperClass,
        title: item.Name,
        action,
        dataAttributes
    });

    const getListContentProps = () => ({
        item,
        listOptions,
        enableContentWrapper,
        enableOverview,
        enableSideMediaInfo,
        clickEntireItem,
        action,
        isLargeStyle,
        downloadWidth
    });

    return {
        getListdWrapperProps,
        getListContentProps
    };
}

export default useList;
