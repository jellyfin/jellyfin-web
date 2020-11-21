import tvguide from '../../components/guide/guide';

export default function (view, params, tabContent) {
    let guideInstance;
    const self = this;

    self.renderTab = function () {
        if (!guideInstance) {
            guideInstance = new tvguide({
                element: tabContent,
                serverId: ApiClient.serverId()
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
