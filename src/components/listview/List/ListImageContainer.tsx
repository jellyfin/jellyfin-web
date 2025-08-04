import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import { useApi } from 'hooks/useApi';
import useIndicator from '../../indicators/useIndicator';
import layoutManager from '../../layoutManager';
import { getDefaultBackgroundClass } from '../../cardbuilder/cardBuilderUtils';
import { canResume, getChannelImageUrl, getImageUrl } from './listHelper';

import Media from 'components/common/Media';
import PlayArrowIconButton from 'components/common/PlayArrowIconButton';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';

interface ListImageContainerProps {
    item: ItemDto;
    listOptions: ListOptions;
    action?: string | null;
    isLargeStyle: boolean;
    clickEntireItem?: boolean;
    downloadWidth?: number;
}

const ListImageContainer: FC<ListImageContainerProps> = ({
    item = {},
    listOptions,
    action,
    isLargeStyle,
    clickEntireItem,
    downloadWidth
}) => {
    const { api } = useApi();
    const { getMediaSourceIndicator, getProgressBar, getPlayedIndicator } =
        useIndicator(item);
    const imgInfo =
        listOptions.imageSource === 'channel'
            ? getChannelImageUrl(item, api, downloadWidth)
            : getImageUrl(item, api, downloadWidth);

    const defaultCardImageIcon = listOptions.defaultCardImageIcon;
    const disableIndicators = listOptions.disableIndicators;
    const imgUrl = imgInfo?.imgUrl;
    const blurhash = imgInfo.blurhash;

    const imageClass = classNames(
        'listItemImage',
        { 'listItemImage-large': isLargeStyle },
        { 'listItemImage-channel': listOptions.imageSource === 'channel' },
        { 'listItemImage-large-tv': isLargeStyle && layoutManager.tv },
        { itemAction: !clickEntireItem },
        { [getDefaultBackgroundClass(item.Name)]: !imgUrl }
    );

    const playOnImageClick = listOptions.imagePlayButton && !layoutManager.tv;

    const imageAction = playOnImageClick ? 'link' : action;

    const btnCssClass =
        'paper-icon-button-light listItemImageButton itemAction';

    const mediaSourceIndicator = getMediaSourceIndicator();
    const playedIndicator = getPlayedIndicator();
    const progressBar = getProgressBar();
    const playbackPositionTicks = item?.UserData?.PlaybackPositionTicks;

    return (
        <Box data-action={imageAction} className={imageClass}>
            <Media
                item={item}
                imgUrl={imgUrl}
                blurhash={blurhash}
                defaultCardImageIcon={defaultCardImageIcon}
            />

            {disableIndicators !== true && mediaSourceIndicator}

            {playedIndicator && (
                <Box className='indicators listItemIndicators'>
                    {playedIndicator}
                </Box>
            )}

            {playOnImageClick && (
                <PlayArrowIconButton
                    className={btnCssClass}
                    action={
                        canResume(playbackPositionTicks) ? 'resume' : 'play'
                    }
                    title={
                        canResume(playbackPositionTicks)
                            ? 'ButtonResume'
                            : 'Play'
                    }
                />
            )}

            {progressBar}
        </Box>
    );
};

export default ListImageContainer;
