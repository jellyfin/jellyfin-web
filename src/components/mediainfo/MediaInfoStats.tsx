import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box/Box';
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

    // Create stable key from content - use type + text + index as fallback
    const getInfoKey = (info: MiscInfo, index: number): string => {
        const type = info.type ?? 'info';
        const text = String(info.text ?? '');
        return `${type}-${text}-${index}`;
    };

    return (
        <Box className={cssClass}>
            {mediaInfoStats.map((info, index) => (
                <MediaInfoItem
                    key={getInfoKey(info, index)}
                    className={infoclass}
                    miscInfo={info}
                />
            ))}
        </Box>
    );
};

export default MediaInfoStats;
