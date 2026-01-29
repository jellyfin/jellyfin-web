import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from 'types/plugin';
import { logger } from 'utils/logger';

function showErrorMessage() {
    logger.warn(globalize.translate('MessagePlayAccessRestricted'), {
        component: 'PlayAccessValidation'
    });
}

class PlayAccessValidation {
    constructor() {
        this.name = 'Playback validation';
        this.type = PluginType.PreplayIntercept;
        this.id = 'playaccessvalidation';
        this.order = -2;
    }

    intercept(options) {
        const item = options.item;
        if (!item) {
            return Promise.resolve();
        }
        const serverId = item.ServerId;
        if (!serverId) {
            return Promise.resolve();
        }

        return ServerConnections.getApiClient(serverId)
            .getCurrentUser()
            .then((user) => {
                if (user.Policy.EnableMediaPlayback) {
                    return Promise.resolve();
                }

                // reject but don't show an error message
                if (!options.fullscreen) {
                    return Promise.reject();
                }

                return showErrorMessage().finally(() => Promise.reject());
            });
    }
}

export default PlayAccessValidation;
