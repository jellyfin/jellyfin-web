import loading from '../../../components/loading/loading';

function onFinish() {
    loading.show();
    ApiClient.ajax({
        url: ApiClient.getUrl('Startup/Complete'),
        type: 'POST'
    }).then(function () {
        loading.hide();
        window.location.href = 'index.html';
    });
}

export default function (view) {
    view.querySelector('.btnWizardNext').addEventListener('click', onFinish);
}
