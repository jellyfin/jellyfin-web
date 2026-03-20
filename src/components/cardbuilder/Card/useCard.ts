import classNames from 'classnames';

import layoutManager from 'components/layoutManager';
import { ItemAction } from 'constants/itemAction';
import { useApi } from 'hooks/useApi';
import { ItemKind } from 'types/base/models/item-kind';
import { ItemMediaKind } from 'types/base/models/item-media-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';
import { getDataAttributes } from 'utils/items';

import {
    resolveAction,
    resolveMixedShapeByAspectRatio
} from '../utils/builder';
import { CardShape } from '../utils/shape';
import { getCardImageUrl } from '../utils/url';

interface UseCardProps {
    item: ItemDto;
    cardOptions: CardOptions;
}

function useCard({ item, cardOptions }: UseCardProps) {
    const { api } = useApi();
    const action = resolveAction({
        defaultAction: cardOptions.action ?? ItemAction.Link,
        isFolder: item.IsFolder ?? false,
        isPhoto: item.MediaType === ItemMediaKind.Photo
    });

    let shape = cardOptions.shape;

    if (shape === CardShape.Mixed) {
        shape = resolveMixedShapeByAspectRatio(item.PrimaryImageAspectRatio);
    }

    const {
        imgUrl,
        blurhash,
        forceName,
        coverImage
    } = getCardImageUrl({
        api,
        item: item.ProgramInfo ?? item,
        options: cardOptions,
        shape
    });
    const coveredImage = cardOptions.coverImage ?? coverImage;
    const overlayText = cardOptions.overlayText;

    const nameWithPrefix = item.SortName ?? item.Name ?? '';
    let prefix = nameWithPrefix.substring(
        0,
        Math.min(3, nameWithPrefix.length)
    );

    if (prefix) {
        prefix = prefix.toUpperCase();
    }

    const dataAttributes = getDataAttributes(
        {
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
        }
    );

    const cardClass = classNames(
        'card',
        { [`${shape}Card`]: shape },
        cardOptions.cardCssClass,
        cardOptions.cardClass,
        { 'card-hoverable': layoutManager.desktop },
        { groupedCard: cardOptions.showChildCountIndicator && item.ChildCount },
        {
            'card-withuserdata':
                item.Type !== ItemKind.MusicAlbum
                && item.Type !== ItemKind.MusicArtist
                && item.Type !== ItemKind.Audio
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
        blurhash: blurhash ?? undefined,
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
