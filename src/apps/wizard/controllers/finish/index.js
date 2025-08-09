import loading from 'components/loading/loading';
import { ServerConnections } from 'lib/jellyfin-apiclient';

function onFinish() {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.ajax({
        url: apiClient.getUrl('Startup/Complete'),
        type: 'POST'
    }).then(() => {
        loading.hide();
        window.location.href = '';
    });
}

export default function (view) {
    view.querySelector('.btnWizardNext').addEventListener('click', onFinish);
}
