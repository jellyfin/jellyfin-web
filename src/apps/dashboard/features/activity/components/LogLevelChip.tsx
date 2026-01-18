import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import Chip from '@mui/material/Chip/Chip';
import React, { useMemo } from 'react';

import globalize from 'lib/globalize';
import getLogLevelColor from '../utils/getLogLevelColor';

const LogLevelChip = ({ level }: { level: LogLevel }) => {
    const levelText = useMemo(() => globalize.translate(`LogLevel.${level}`), [level]);

    return (
        <Chip
            size='small'
            color={getLogLevelColor(level)}
            label={levelText}
            title={levelText}
        />
    );
};

export default LogLevelChip;
