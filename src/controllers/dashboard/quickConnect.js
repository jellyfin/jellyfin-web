import loading from '../../components/loading/loading';
import toast from '../../components/toast/toast';
import globalize from '../../scripts/globalize';

const unavailable = 'Unavailable';
const available = 'Available';
const active = 'Active';
let page;

export default function(view) {
    view.addEventListener('viewshow', function () {
        page = this;
        loading.show();
        page.querySelector('#btnQuickConnectSubmit').onclick = onSubmit;
        updatePage();
    });
}

function loadPage(status) {
    const check = status === available || status === active;

    page.querySelector('#quickConnectStatus').textContent = status.toLocaleLowerCase();
    page.querySelector('#chkQuickConnectAvailable').checked = check;

    loading.hide();
}

function onSubmit() {
    loading.show();

    const newStatus = page.querySelector('#chkQuickConnectAvailable').checked ? available : unavailable;

    const url = ApiClient.getUrl('/QuickConnect/Available?Status=' + newStatus);

    ApiClient.ajax({
        type: 'POST',
        url: url
    }, true).then(() => {
        toast(globalize.translate('SettingsSaved'));
        setTimeout(updatePage, 500);

        return true;
    }).catch((e) => {
        console.error('Unable to set quick connect status. error:', e);
    });

    loading.hide();
    return false;
}

function updatePage() {
    ApiClient.getQuickConnect('Status').then((response) => {
        loadPage(response);
        return true;
    }).catch((e) => {
        console.error('Unable to get quick connect status. error:', e);
    });
}
