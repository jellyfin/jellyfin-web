import IconButton from '@mui/material/IconButton';
import PermMedia from '@mui/icons-material/PermMedia';
import React, { type FC } from 'react';
import { Link } from 'react-router-dom';

import type { ActivityLogEntryCell } from 'apps/dashboard/features/activity/types/ActivityLogEntryCell';
import globalize from 'lib/globalize';

const ActionsCell: FC<ActivityLogEntryCell> = ({ row }) =>
    row.original.ItemId ? (
        <IconButton
            size='large'
            title={globalize.translate('LabelMediaDetails')}
            component={Link}
            to={`/details?id=${row.original.ItemId}`}
        >
            <PermMedia fontSize='inherit' />
        </IconButton>
    ) : undefined;

export default ActionsCell;
