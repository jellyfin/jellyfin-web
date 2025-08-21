import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import useMediaInfoStats from './useMediaInfoStats';

import MediaInfoItem from './MediaInfoItem';
import type { ItemDto } from 'types/base/models/item-dto';
import type { MiscInfo } from 'types/mediaInfoItem';
import type { MediaInfoStatsOpts } from './type';

interface MediaInfoStatsProps extends MediaInfoStatsOpts {
    className?: string;
    infoclass?: string;
    item: ItemDto;
}

const MediaInfoStats: FC<MediaInfoStatsProps> = ({
    className,
    infoclass,
    item,
    showResolutionInfo,
    showVideoStreamCodecInfo,
    showAudoChannelInfo,
    showAudioStreamCodecInfo,
    showDateAddedInfo
}) => {
    const mediaInfoStats = useMediaInfoStats({
        item,
        showResolutionInfo,
        showVideoStreamCodecInfo,
        showAudoChannelInfo,
        showAudioStreamCodecInfo,
        showDateAddedInfo
    });

    const cssClass = classNames(className);

    const renderMediaInfo = (info: MiscInfo, index: number) => (
        <MediaInfoItem key={index} className={infoclass} miscInfo={info} />
    );

    return (
        <Box className={cssClass}>
            {mediaInfoStats.map((info, index) => renderMediaInfo(info, index))}
        </Box>
    );
};

export default MediaInfoStats;
