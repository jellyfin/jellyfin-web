import loading from 'loading';
import dom from 'dom';
import globalize from 'globalize';
import imageHelper from 'scripts/imagehelper';
import * as datefns from 'date-fns';
import dfnshelper from 'dfnshelper';
import 'emby-button';
import 'emby-itemscontainer';
import 'cardStyle';

/* eslint-disable indent */

    // Local cache of loaded
    let deviceIds = [];

    function canDelete(deviceId) {
        return deviceId !== ApiClient.deviceId();
    }

    function deleteAllDevices(page) {
        const msg = globalize.translate('DeleteDevicesConfirmation');

        require(['confirm'], async function (confirm) {
            await confirm({
                text: msg,
                title: globalize.translate('HeaderDeleteDevices'),
                confirmText: globalize.translate('ButtonDelete'),
                primary: 'delete'
            });

            loading.show();
            await Promise.all(
                deviceIds.filter(canDelete).map((id) => ApiClient.deleteDevice(id))
            );
            loadData(page);
        });
    }

    function deleteDevice(page, id) {
        const msg = globalize.translate('DeleteDeviceConfirmation');

        import('confirm').then(({default: confirm}) => {
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

        import('actionsheet').then(({default: actionsheet}) => {
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
        let html = '';
        html += devices.map(function (device) {
            let deviceHtml = '';
            deviceHtml += "<div data-id='" + device.Id + "' class='card backdropCard'>";
            deviceHtml += '<div class="cardBox visualCardBox">';
            deviceHtml += '<div class="cardScalable">';
            deviceHtml += '<div class="cardPadder cardPadder-backdrop"></div>';
            deviceHtml += '<a is="emby-linkbutton" href="' + (canEdit ? 'device.html?id=' + device.Id : '#') + '" class="cardContent cardImageContainer">';
            const iconUrl = imageHelper.getDeviceIcon(device);

            if (iconUrl) {
                deviceHtml += '<div class="cardImage" style="background-image:url(\'' + iconUrl + "');background-size: auto 64%;background-position:center center;\">";
                deviceHtml += '</div>';
            } else {
                deviceHtml += '<span class="cardImageIcon material-icons tablet_android"></span>';
            }

            deviceHtml += '</a>';
            deviceHtml += '</div>';
            deviceHtml += '<div class="cardFooter">';

            if (canEdit || canDelete(device.Id)) {
                deviceHtml += '<div style="text-align:right; float:right;padding-top:5px;">';
                deviceHtml += '<button type="button" is="paper-icon-button-light" data-id="' + device.Id + '" title="' + globalize.translate('Menu') + '" class="btnDeviceMenu"><span class="material-icons more_vert"></span></button>';
                deviceHtml += '</div>';
            }

            deviceHtml += "<div class='cardText'>";
            deviceHtml += device.Name;
            deviceHtml += '</div>';
            deviceHtml += "<div class='cardText cardText-secondary'>";
            deviceHtml += device.AppName + ' ' + device.AppVersion;
            deviceHtml += '</div>';
            deviceHtml += "<div class='cardText cardText-secondary'>";

            if (device.LastUserName) {
                deviceHtml += device.LastUserName;
                deviceHtml += ', ' + datefns.formatDistanceToNow(Date.parse(device.DateLastActivity), dfnshelper.localeWithSuffix);
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
    export default function (view, params) {
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
