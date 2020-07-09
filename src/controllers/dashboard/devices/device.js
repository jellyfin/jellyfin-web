import loading from 'loading';
import libraryMenu from 'libraryMenu';
import dom from 'dom';
import 'emby-input';
import 'emby-button';

/* eslint-disable indent */

    function load(page, device, deviceOptions) {
        page.querySelector('#txtCustomName', page).value = deviceOptions.CustomName || '';
        page.querySelector('.reportedName', page).innerHTML = device.Name || '';
    }

    function loadData() {
        var page = this;
        loading.show();
        var id = getParameterByName('id');
        var promise1 = ApiClient.getJSON(ApiClient.getUrl('Devices/Info', {
            Id: id
        }));
        var promise2 = ApiClient.getJSON(ApiClient.getUrl('Devices/Options', {
            Id: id
        }));
        Promise.all([promise1, promise2]).then(function (responses) {
            load(page, responses[0], responses[1]);
            loading.hide();
        });
    }

    function save(page) {
        var id = getParameterByName('id');
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
        var form = this;
        save(dom.parentWithClass(form, 'page'));
        e.preventDefault();
        return false;
    }

    export default function (view, params) {
        view.querySelector('form').addEventListener('submit', onSubmit);
        view.addEventListener('viewshow', loadData);
    };

/* eslint-enable indent */
