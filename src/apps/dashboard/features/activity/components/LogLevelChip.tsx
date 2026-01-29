import { type LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import globalize from 'lib/globalize';
import React, { useMemo } from 'react';
import { Chip } from 'ui-primitives';
import getLogLevelColor from '../utils/getLogLevelColor';

const LogLevelChip = ({ level }: { level: LogLevel }) => {
    const levelText = useMemo(() => globalize.translate(`LogLevel.${level}`), [level]);
    const variant = getLogLevelColor(level);

    return (
        <Chip size="sm" variant={variant as 'error' | 'warning' | 'info' | 'success' | 'neutral'}>
            <span title={levelText}>{levelText}</span>
        </Chip>
    );
};

export default LogLevelChip;
