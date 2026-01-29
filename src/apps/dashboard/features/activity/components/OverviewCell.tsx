import { InfoCircledIcon } from '@radix-ui/react-icons';
import React, { useCallback, useState } from 'react';
import { Box, Flex, IconButton, Tooltip } from 'ui-primitives';
import type { ActivityLogEntryCell } from '../types/ActivityLogEntryCell';

const OverviewCell = ({ row }: ActivityLogEntryCell) => {
    const { ShortOverview, Overview } = row.original;
    const displayValue = ShortOverview ?? Overview;
    const [open, setOpen] = useState(false);

    const onTooltipClose = useCallback(() => {
        setOpen(false);
    }, []);

    const onTooltipOpen = useCallback(() => {
        setOpen(true);
    }, []);

    if (!displayValue) return null;

    return (
        <Flex style={{ width: '100%', alignItems: 'center' }}>
            <div
                style={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
                title={displayValue}
            >
                {displayValue}
            </div>
            {ShortOverview && Overview && (
                <Tooltip title={Overview} placement="top">
                    <IconButton variant="plain" onClick={onTooltipOpen}>
                        <InfoCircledIcon />
                    </IconButton>
                </Tooltip>
            )}
        </Flex>
    );
};

export default OverviewCell;
