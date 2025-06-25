import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import Chip from '@mui/material/Chip';

import globalize from 'lib/globalize';

const LogLevelChip = ({ level }: { level: LogLevel }) => {
    let color: 'info' | 'warning' | 'error' | undefined;
    switch (level) {
        case LogLevel.Information:
            color = 'info';
            break;
        case LogLevel.Warning:
            color = 'warning';
            break;
        case LogLevel.Error:
        case LogLevel.Critical:
            color = 'error';
            break;
    }

    const levelText = globalize.translate(`LogLevel.${level}`);

    return (
        <Chip
            size='small'
            color={color}
            label={levelText}
            title={levelText}
        />
    );
};

export default LogLevelChip;
