import classNames from 'classnames';
import useCardImageUrl from './useCardImageUrl';
import {
    resolveAction,
    resolveMixedShapeByAspectRatio
} from '../cardBuilderUtils';
import { getDataAttributes } from 'utils/items';
import { CardShape } from 'utils/card';
import layoutManager from 'components/layoutManager';

import { ItemKind } from 'types/base/models/item-kind';
import { ItemMediaKind } from 'types/base/models/item-media-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

interface UseCardProps {
    item: ItemDto;
    cardOptions: CardOptions;
}

function useCard({ item, cardOptions }: UseCardProps) {
    const action = resolveAction({
        defaultAction: cardOptions.action ?? 'link',
        isFolder: item.IsFolder ?? false,
        isPhoto: item.MediaType === ItemMediaKind.Photo
    });

    let shape = cardOptions.shape;

    if (shape === CardShape.Mixed) {
        shape = resolveMixedShapeByAspectRatio(item.PrimaryImageAspectRatio);
    }

    const imgInfo = useCardImageUrl({
        item: item.ProgramInfo ?? item,
        cardOptions,
        shape
    });
    const imgUrl = imgInfo.imgUrl;
    const blurhash = imgInfo.blurhash;
    const forceName = imgInfo.forceName;
    const coveredImage = cardOptions.coverImage ?? imgInfo.coverImage;
    const overlayText = cardOptions.overlayText;

    const nameWithPrefix = item.SortName ?? item.Name ?? '';
    let prefix = nameWithPrefix.substring(
        0,
        Math.min(3, nameWithPrefix.length)
    );

    if (prefix) {
        prefix = prefix.toUpperCase();
    }

    const dataAttributes = getDataAttributes({
        action,
        itemServerId: item.ServerId ?? cardOptions.serverId,
        context: cardOptions.context,
        parentId: cardOptions.parentId,
        collectionId: cardOptions.collectionId,
        playlistId: cardOptions.playlistId,
        itemId: item.Id,
        itemTimerId: item.TimerId,
        itemSeriesTimerId: item.SeriesTimerId,
        itemChannelId: item.ChannelId,
        itemType: item.Type,
        itemMediaType: item.MediaType,
        itemCollectionType: item.CollectionType,
        itemIsFolder: item.IsFolder,
        itemPath: item.Path,
        itemStartDate: item.StartDate,
        itemEndDate: item.EndDate,
        itemUserData: item.UserData,
        prefix
    });

    const cardClass = classNames(
        'card',
        { [`${shape}Card`]: shape },
        cardOptions.cardCssClass,
        cardOptions.cardClass,
        { 'card-hoverable': layoutManager.desktop },
        { groupedCard: cardOptions.showChildCountIndicator && item.ChildCount },
        {
            'card-withuserdata':
                item.Type !== ItemKind.MusicAlbum &&
                item.Type !== ItemKind.MusicArtist &&
                item.Type !== ItemKind.Audio
        },
        { itemAction: layoutManager.tv }
    );

    const cardBoxClass = classNames(
        'cardBox',
        { visualCardBox: cardOptions.cardLayout },
        { 'cardBox-bottompadded': !cardOptions.cardLayout }
    );

    const getCardWrapperProps = () => ({
        className: cardClass,
        dataAttributes
    });

    const getCardBoxProps = () => ({
        action,
        item,
        cardOptions,
        className: cardBoxClass,
        shape,
        imgUrl,
        blurhash,
        forceName,
        coveredImage,
        overlayText
    });

    return {
        getCardWrapperProps,
        getCardBoxProps
    };
}

export default useCard;
