import loading from '../../../components/loading/loading';
import dom from '../../../scripts/dom';
import '../../../elements/emby-input/emby-input';
import '../../../elements/emby-button/emby-button';
import Dashboard from '../../../utils/dashboard';
import { getParameterByName } from '../../../utils/url.ts';

function load(page, device, deviceOptions) {
    page.querySelector('#txtCustomName', page).value = deviceOptions.CustomName || '';
    page.querySelector('.reportedName', page).innerText = device.Name || '';
}

function loadData() {
    const page = this;
    loading.show();
    const id = getParameterByName('id');
    const promise1 = ApiClient.getJSON(ApiClient.getUrl('Devices/Info', {
        Id: id
    }));
    const promise2 = ApiClient.getJSON(ApiClient.getUrl('Devices/Options', {
        Id: id
    }));
    Promise.all([promise1, promise2]).then(function (responses) {
        load(page, responses[0], responses[1]);
        loading.hide();
    });
}

function save(page) {
    const id = getParameterByName('id');
    ApiClient.ajax({
        url: ApiClient.getUrl('Devices/Options', {
            Id: id
        }),
        type: 'POST',
        data: JSON.stringify({
            CustomName: page.querySelector('#txtCustomName').value
        }),
        contentType: 'application/json'
    }).then(Dashboard.processServerConfigurationUpdateResult);
}

function onSubmit(e) {
    const form = this;
    save(dom.parentWithClass(form, 'page'));
    e.preventDefault();
    return false;
}

export default function (view) {
    view.querySelector('form').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', loadData);
}

