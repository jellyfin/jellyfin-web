import Guide from '../../components/guide/guide';

export default function (view, params, tabContent) {
    let guideInstance;
    const self = this;

    self.renderTab = () => {
        if (!guideInstance) {
            guideInstance = new Guide({
                element: tabContent,
                serverId: ApiClient.serverId()
            });
        }
    };

    self.onShow = () => {
        if (guideInstance) {
            guideInstance.resume();
        }
    };

    self.onHide = () => {
        if (guideInstance) {
            guideInstance.pause();
        }
    };
}
