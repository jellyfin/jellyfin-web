import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';

import TextLines from 'components/common/textLines/TextLines';
import { ItemAction } from 'constants/itemAction';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';

import PrimaryMediaInfo from '../../mediainfo/PrimaryMediaInfo';

interface ListItemBodyProps {
    item: ItemDto;
    listOptions: ListOptions;
    action?: ItemAction | null;
    isLargeStyle?: boolean;
    clickEntireItem?: boolean;
    enableContentWrapper?: boolean;
    enableOverview?: boolean;
    enableSideMediaInfo?: boolean;
    getMissingIndicator: () => React.JSX.Element | null
}

const ListItemBody: FC<ListItemBodyProps> = ({
    item = {},
    listOptions = {},
    action,
    isLargeStyle,
    clickEntireItem,
    enableContentWrapper,
    enableOverview,
    enableSideMediaInfo,
    getMissingIndicator
}) => {
    const cssClass = classNames(
        'listItemBody',
        { 'itemAction': !clickEntireItem },
        { 'listItemBody-noleftpadding': listOptions.image === false }
    );

    return (
        <Box data-action={action} className={cssClass}>

            <TextLines
                item={item}
                textClassName='listItemBodyText'
                textLineOpts={{
                    showProgramDateTime: listOptions.showProgramDateTime,
                    showProgramTime: listOptions.showProgramTime,
                    showChannel: listOptions.showChannel,
                    showParentTitle: listOptions.showParentTitle,
                    showIndexNumber: listOptions.showIndexNumber,
                    parentTitleWithTitle: listOptions.parentTitleWithTitle,
                    showArtist: listOptions.showArtist,
                    includeParentInfoInTitle: listOptions.includeParentInfoInTitle,
                    includeIndexNumber: listOptions.includeIndexNumber,
                    showCurrentProgram: listOptions.showCurrentProgram
                }}
                isLargeStyle={isLargeStyle}
            />

            {listOptions.showMediaInfo !== false && !enableSideMediaInfo && (
                <PrimaryMediaInfo
                    className='secondary listItemMediaInfo listItemBodyText'
                    infoclass='mediaInfoText'
                    item={item}
                    showEpisodeTitleInfo
                    showOriginalAirDateInfo
                    showCaptionIndicatorInfo
                    getMissingIndicator={getMissingIndicator}
                />
            )}

            {!enableContentWrapper && enableOverview && item.Overview && (
                <Box className='secondary listItem-overview listItemBodyText'>
                    <bdi>{item.Overview}</bdi>
                </Box>
            )}
        </Box>
    );
};

export default ListItemBody;
