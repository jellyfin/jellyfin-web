import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import useListTextlines from './useListTextlines';
import PrimaryMediaInfo from '../../mediainfo/PrimaryMediaInfo';

import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';

interface ListItemBodyProps {
    item: ItemDto;
    listOptions: ListOptions;
    action?: string | null;
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
    const { listTextLines } = useListTextlines({ item, listOptions, isLargeStyle });
    const cssClass = classNames(
        'listItemBody',
        { 'itemAction': !clickEntireItem },
        { 'listItemBody-noleftpadding': listOptions.image === false }
    );

    return (
        <Box data-action={action} className={cssClass}>

            {listTextLines}

            {listOptions.mediaInfo !== false && !enableSideMediaInfo && (
                <PrimaryMediaInfo
                    className='secondary listItemMediaInfo listItemBodyText'
                    item={item}
                    isEpisodeTitleEnabled={true}
                    isOriginalAirDateEnabled={true}
                    isCaptionIndicatorEnabled={true}
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
