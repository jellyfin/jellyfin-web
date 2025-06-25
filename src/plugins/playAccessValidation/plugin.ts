import alert from 'components/alert';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { Plugin, PluginType } from 'types/plugin.ts';

function showErrorMessage() {
    return alert(globalize.translate('MessagePlayAccessRestricted'));
}

export default class PlayAccessValidation implements Plugin {
    name: string;
    type: PluginType;
    id: string;
    order: number;
    constructor() {
        this.name = 'Playback validation';
        this.type = PluginType.PreplayIntercept;
        this.id = 'playaccessvalidation';
        this.order = -2;
    }

    intercept(options: any) {
        const item = options.item;
        if (!item) {
            return Promise.resolve();
        }
        const serverId = item.ServerId;
        if (!serverId) {
            return Promise.resolve();
        }

        return ServerConnections.getApiClient(serverId).getCurrentUser().then(function (user) {
            if (user.Policy?.EnableMediaPlayback) {
                return Promise.resolve();
            }

            // reject but don't show an error message
            if (!options.fullscreen) {
                return Promise.reject();
            }

            return showErrorMessage()
                .finally(() => Promise.reject());
        });
    }
}
