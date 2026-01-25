import React, { type FC } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives/Box';
import useSecondaryMediaInfo from './useSecondaryMediaInfo';
import useIndicator from 'components/indicators/useIndicator';
import MediaInfoItem from './MediaInfoItem';
import type { ItemDto } from 'types/base/models/item-dto';
import { MiscInfo } from 'types/mediaInfoItem';
import type { SecondaryInfoOpts } from './type';

interface SecondaryMediaInfoProps extends SecondaryInfoOpts {
    className?: string;
    infoclass?: string;
    item: ItemDto;
    showTimerIndicatorInfo?: boolean;
}

const SecondaryMediaInfo: FC<SecondaryMediaInfoProps> = ({
    className,
    infoclass,
    item,
    showProgramTimeInfo,
    showStartDateInfo,
    showChannelNumberInfo,
    showChannelInfo,
    channelInteractive,
    showTimerIndicatorInfo = false
}) => {
    const miscInfo = useSecondaryMediaInfo({
        item,
        showProgramTimeInfo,
        showStartDateInfo,
        showChannelNumberInfo,
        showChannelInfo,
        channelInteractive
    });

    const indicator = useIndicator(item);

    const cssClass = classNames(className);

    // Create stable key from content
    const getInfoKey = (info: MiscInfo, index: number): string => {
        const type = info.type ?? 'info';
        const text = String(info.text ?? '');
        return `${type}-${text}-${index}`;
    };

    return (
        <Box className={cssClass}>
            {miscInfo.map((info, index) => (
                <MediaInfoItem key={getInfoKey(info, index)} className={infoclass} miscInfo={info} />
            ))}

            {showTimerIndicatorInfo !== false && indicator.getTimerIndicator()}
        </Box>
    );
};

export default SecondaryMediaInfo;
