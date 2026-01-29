import { VideoIcon } from '@radix-ui/react-icons';
import { Link } from '@tanstack/react-router';
import type { ActivityLogEntryCell } from 'apps/dashboard/features/activity/types/ActivityLogEntryCell';
import globalize from 'lib/globalize';
import React from 'react';
import { IconButton } from 'ui-primitives';

const ActionsCell = ({ row }: ActivityLogEntryCell) =>
    row.original.ItemId ? (
        <a
            href={`/details?id=${row.original.ItemId}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <IconButton variant="plain" size="lg" title={globalize.translate('LabelMediaDetails')}>
                <VideoIcon />
            </IconButton>
        </a>
    ) : undefined;

export default ActionsCell;
