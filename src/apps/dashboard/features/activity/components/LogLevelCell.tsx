import type { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import React from 'react';

import { type ActivityLogEntryCell } from '../types/ActivityLogEntryCell';
import LogLevelChip from './LogLevelChip';

const LogLevelCell = ({ cell }: ActivityLogEntryCell) => {
    const level = cell.getValue<LogLevel | undefined>();
    return level ? <LogLevelChip level={level} /> : undefined;
};

export default LogLevelCell;
