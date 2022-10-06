import escapeHtml from 'escape-html';
import cardBuilder from '../../../components/cardbuilder/cardBuilder';
import loading from '../../../components/loading/loading';
import dom from '../../../scripts/dom';
import globalize from '../../../scripts/globalize';
import imageHelper from '../../../scripts/imagehelper';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleWithSuffix } from '../../../scripts/dfnshelper';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../../components/cardbuilder/card.scss';
import Dashboard from '../../../utils/dashboard';
import confirm from '../../../components/confirm/confirm';

/* eslint-disable indent */

    // Local cache of loaded
    let deviceIds = [];

    function canDelete(deviceId) {
        return deviceId !== ApiClient.deviceId();
    }

    function deleteAllDevices(page) {
        const msg = globalize.translate('DeleteDevicesConfirmation');

        confirm({
            text: msg,
            title: globalize.translate('HeaderDeleteDevices'),
            confirmText: globalize.translate('Delete'),
            primary: 'delete'
        }).then(async () => {
            loading.show();
            await Promise.all(
                deviceIds.filter(canDelete).map((id) => ApiClient.deleteDevice(id))
            );
            loadData(page);
        });
    }

    function deleteDevice(page, id) {
        const msg = globalize.translate('DeleteDeviceConfirmation');

        confirm({
            text: msg,
            title: globalize.translate('HeaderDeleteDevice'),
            confirmText: globalize.translate('Delete'),
            primary: 'delete'
        }).then(async () => {
            loading.show();
            await ApiClient.deleteDevice(id);
            loadData(page);
        });
    }

    function showDeviceMenu(view, btn, deviceId) {
        const menuItems = [];

        if (canEdit) {
            menuItems.push({
                name: globalize.translate('Edit'),
                id: 'open',
                icon: 'mode_edit'
            });
        }

        if (canDelete(deviceId)) {
            menuItems.push({
                name: globalize.translate('Delete'),
                id: 'delete',
                icon: 'delete'
            });
        }

        import('../../../components/actionSheet/actionSheet').then(({default: actionsheet}) => {
            actionsheet.show({
                items: menuItems,
                positionTo: btn,
                callback: function (id) {
                    switch (id) {
                        case 'open':
                            Dashboard.navigate('device.html?id=' + deviceId);
                            break;

                        case 'delete':
                            deleteDevice(view, deviceId);
                    }
                }
            });
        });
    }

    function load(page, devices) {
        const localeWithSuffix = getLocaleWithSuffix();

        let html = '';
        html += devices.map(function (device) {
            let deviceHtml = '';
            deviceHtml += "<div data-id='" + device.Id + "' class='card backdropCard'>";
            deviceHtml += '<div class="cardBox visualCardBox">';
            deviceHtml += '<div class="cardScalable">';
            deviceHtml += '<div class="cardPadder cardPadder-backdrop"></div>';
            deviceHtml += `<a is="emby-linkbutton" href="${canEdit ? '#/device.html?id=' + device.Id : '#'}" class="cardContent cardImageContainer ${cardBuilder.getDefaultBackgroundClass()}">`;
            const iconUrl = imageHelper.getDeviceIcon(device);

            if (iconUrl) {
                deviceHtml += '<div class="cardImage" style="background-image:url(\'' + iconUrl + "');background-size: auto 64%;background-position:center center;\">";
                deviceHtml += '</div>';
            } else {
                deviceHtml += '<span class="cardImageIcon material-icons tablet_android" aria-hidden="true"></span>';
            }

            deviceHtml += '</a>';
            deviceHtml += '</div>';
            deviceHtml += '<div class="cardFooter">';

            if (canEdit || canDelete(device.Id)) {
                deviceHtml += '<div style="text-align:right; float:right;padding-top:5px;">';
                deviceHtml += '<button type="button" is="paper-icon-button-light" data-id="' + device.Id + '" title="' + globalize.translate('Menu') + '" class="btnDeviceMenu"><span class="material-icons more_vert" aria-hidden="true"></span></button>';
                deviceHtml += '</div>';
            }

            deviceHtml += "<div class='cardText'>";
            deviceHtml += escapeHtml(device.Name);
            deviceHtml += '</div>';
            deviceHtml += "<div class='cardText cardText-secondary'>";
            deviceHtml += escapeHtml(device.AppName + ' ' + device.AppVersion);
            deviceHtml += '</div>';
            deviceHtml += "<div class='cardText cardText-secondary'>";

            if (device.LastUserName) {
                deviceHtml += escapeHtml(device.LastUserName);
                deviceHtml += ', ' + formatDistanceToNow(Date.parse(device.DateLastActivity), localeWithSuffix);
            }

            deviceHtml += '&nbsp;';
            deviceHtml += '</div>';
            deviceHtml += '</div>';
            deviceHtml += '</div>';
            deviceHtml += '</div>';
            return deviceHtml;
        }).join('');
        page.querySelector('.devicesList').innerHTML = html;
    }

    function loadData(page) {
        loading.show();
        ApiClient.getJSON(ApiClient.getUrl('Devices')).then(function (result) {
            load(page, result.Items);
            deviceIds = result.Items.map((device) => device.Id);
            loading.hide();
        });
    }

    const canEdit = ApiClient.isMinServerVersion('3.4.1.31');
    export default function (view) {
        view.querySelector('.devicesList').addEventListener('click', function (e) {
            const btnDeviceMenu = dom.parentWithClass(e.target, 'btnDeviceMenu');

            if (btnDeviceMenu) {
                showDeviceMenu(view, btnDeviceMenu, btnDeviceMenu.getAttribute('data-id'));
            }
        });
        view.addEventListener('viewshow', function () {
            loadData(this);
        });

        view.querySelector('#deviceDeleteAll').addEventListener('click', function() {
            deleteAllDevices(view);
        });
    }
/* eslint-enable indent */
