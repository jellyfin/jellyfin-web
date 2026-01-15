import datetime from '@/scripts/datetime';
import { appRouter } from '@/components/router/appRouter';
import type { NullableString } from '@/types/base/common/shared/types';
import type { ItemDto } from '@/types/base/models/item-dto';
import type { MiscInfo } from '@/types/mediaInfoItem';
import { ItemKind } from '@/types/base/models/item-kind';
import type { SecondaryInfoOpts } from './type';

function addProgramTime(
    showProgramTimeInfo: boolean,
    showStartDateInfo: boolean,
    showEndDateInfo: boolean,
    itemStartDate: NullableString,
    itemEndDate: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    let programTimeText = '';
    let date;

    if (showProgramTimeInfo && itemStartDate) {
        try {
            date = datetime.parseISO8601Date(itemStartDate);

            if (showStartDateInfo) {
                programTimeText += datetime.toLocaleDateString(date, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
            }

            programTimeText += ` ${datetime.getDisplayTime(date)}`;

            if (showEndDateInfo && itemEndDate) {
                date = datetime.parseISO8601Date(itemEndDate);
                programTimeText += ` - ${datetime.getDisplayTime(date)}`;
            }
            addMiscInfo({ text: programTimeText });
        } catch {
            console.error('error parsing date:', itemStartDate);
        }
    }
}

function addChannelNumber(
    showChannelNumberInfo: boolean,
    itemChannelNumber: NullableString,
    addMiscInfo: (val: MiscInfo) => void
): void {
    if (showChannelNumberInfo && itemChannelNumber) {
        addMiscInfo({
            text: `CH ${itemChannelNumber}`
        });
    }
}

const addChannelName = (
    showChannelInfo: boolean,
    channelInteractive: boolean,
    item: ItemDto,
    addMiscInfo: (val: MiscInfo) => void
) => {
    if (showChannelInfo && item.ChannelName) {
        if (channelInteractive && item.ChannelId) {
            const url = appRouter.getRouteUrl({
                ServerId: item.ServerId,
                Type: ItemKind.TvChannel,
                Name: item.ChannelName,
                Id: item.ChannelId
            });

            addMiscInfo({
                textAction: {
                    url,
                    title: item.ChannelName
                }
            });
        } else {
            addMiscInfo({ text: item.ChannelName });
        }
    }
};

interface UseSecondaryMediaInfoProps extends SecondaryInfoOpts {
    item: ItemDto;
}

function useSecondaryMediaInfo({
    item,
    showProgramTimeInfo = false,
    showStartDateInfo = false,
    showEndDateInfo = false,
    showChannelNumberInfo = false,
    showChannelInfo = false,
    channelInteractive = false
}: UseSecondaryMediaInfoProps) {
    const { EndDate, StartDate, ChannelNumber } = item;

    const miscInfo: MiscInfo[] = [];

    if (item.Type === ItemKind.Program) {
        const addMiscInfo = (val: MiscInfo) => {
            if (val) {
                miscInfo.push(val);
            }
        };

        addProgramTime(
            showProgramTimeInfo,
            showStartDateInfo,
            showEndDateInfo,
            StartDate,
            EndDate,
            addMiscInfo
        );

        addChannelNumber(showChannelNumberInfo, ChannelNumber, addMiscInfo);

        addChannelName(showChannelInfo, channelInteractive, item, addMiscInfo);
    }
    return miscInfo;
}

export default useSecondaryMediaInfo;
