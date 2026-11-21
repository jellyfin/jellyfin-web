import Guide from 'components/guide/guide';
import { ServerConnections } from 'lib/jellyfin-apiclient';

export default function (view, params, tabContent) {
    let guideInstance;
    const self = this;

    self.renderTab = function () {
        if (!guideInstance) {
            guideInstance = new Guide({
                element: tabContent,
                serverId: ServerConnections.currentApiClient().serverId()
            });
        }
    };

    self.onShow = function () {
        if (guideInstance) {
            guideInstance.resume();
        }
    };

    self.onHide = function () {
        if (guideInstance) {
            guideInstance.pause();
        }
    };
}
