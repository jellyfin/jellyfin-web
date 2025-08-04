import Info from '@mui/icons-material/Info';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { type FC, useCallback, useState } from 'react';

import type { ActivityLogEntryCell } from '../types/ActivityLogEntryCell';

const OverviewCell: FC<ActivityLogEntryCell> = ({ row }) => {
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
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center'
            }}
        >
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
                component='div'
                title={displayValue}
            >
                {displayValue}
            </Box>
            {ShortOverview && Overview && (
                <ClickAwayListener onClickAway={onTooltipClose}>
                    <Tooltip
                        title={Overview}
                        placement='top'
                        arrow
                        onClose={onTooltipClose}
                        open={open}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                    >
                        <IconButton onClick={onTooltipOpen}>
                            <Info />
                        </IconButton>
                    </Tooltip>
                </ClickAwayListener>
            )}
        </Box>
    );
};

export default OverviewCell;
