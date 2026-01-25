import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';

const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
        case LogLevel.Information:
            return 'info';
        case LogLevel.Warning:
            return 'warning';
        case LogLevel.Error:
        case LogLevel.Critical:
            return 'error';
        default:
            return 'neutral';
    }
};

export default getLogLevelColor;
