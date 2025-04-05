import loading from 'components/loading/loading';
import ServerConnections from 'components/ServerConnections';

function onFinish() {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.ajax({
        url: apiClient.getUrl('Startup/Complete'),
        type: 'POST'
    }).then(function () {
        loading.hide();
        window.location.href = 'index.html';
    });
}

export default function (view) {
    view.querySelector('.btnWizardNext').addEventListener('click', onFinish);
}
