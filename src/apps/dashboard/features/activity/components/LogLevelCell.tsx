import type { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import React, { type FC } from 'react';

import { ActivityLogEntryCell } from '@/apps/dashboard/features/activity/types/ActivityLogEntryCell';
import LogLevelChip from './LogLevelChip';

const LogLevelCell: FC<ActivityLogEntryCell> = ({ cell }) => {
    const level = cell.getValue<LogLevel | undefined>();
    return level ? (
        <LogLevelChip level={level} />
    ) : undefined;
};

export default LogLevelCell;
