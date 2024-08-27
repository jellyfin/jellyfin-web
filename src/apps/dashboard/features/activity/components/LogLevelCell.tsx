import type { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import React, { type FC } from 'react';

import { ActivityLogEntryCell } from '../types/ActivityLogEntryCell';
import LogLevelChip from './LogLevelChip';

const LogLevelCell: FC<ActivityLogEntryCell> = ({ cell }) => (
    cell.getValue<LogLevel | undefined>() ? (
        <LogLevelChip level={cell.getValue<LogLevel>()} />
    ) : undefined
);

export default LogLevelCell;
