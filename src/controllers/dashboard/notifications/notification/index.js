import 'jquery';
import '../../../../elements/emby-checkbox/emby-checkbox';
import Dashboard from '../../../../scripts/clientUtils';

function fillItems(elem, items, cssClass, idPrefix, currentList, isEnabledList) {
    let html = '<div class="checkboxList paperList" style="padding: .5em 1em;">';
    html += items.map(function (u) {
        const isChecked = isEnabledList ? currentList.indexOf(u.Id) != -1 : currentList.indexOf(u.Id) == -1;
        const checkedHtml = isChecked ? ' checked="checked"' : '';
        return '<label><input is="emby-checkbox" class="' + cssClass + '" type="checkbox" data-itemid="' + u.Id + '"' + checkedHtml + '/><span>' + u.Name + '</span></label>';
    }).join('');
    html += '</div>';
    elem.html(html).trigger('create');
}

function reload(page) {
    const type = getParameterByName('type');
    const promise1 = ApiClient.getUsers();
    const promise2 = ApiClient.getNamedConfiguration(notificationsConfigurationKey);
    const promise3 = ApiClient.getJSON(ApiClient.getUrl('Notifications/Types'));
    const promise4 = ApiClient.getJSON(ApiClient.getUrl('Notifications/Services'));
    Promise.all([promise1, promise2, promise3, promise4]).then(function (responses) {
        const users = responses[0];
        const notificationOptions = responses[1];
        const types = responses[2];
        const services = responses[3];
        let notificationConfig = notificationOptions.Options.filter(function (n) {
            return n.Type == type;
        })[0];
        const typeInfo = types.filter(function (n) {
            return n.Type == type;
        })[0] || {};

        if (typeInfo.IsBasedOnUserEvent) {
            $('.monitorUsers', page).show();
        } else {
            $('.monitorUsers', page).hide();
        }

        $('.notificationType', page).html(typeInfo.Name || 'Unknown Notification');

        if (!notificationConfig) {
            notificationConfig = {
                DisabledMonitorUsers: [],
                SendToUsers: [],
                DisabledServices: [],
                SendToUserMode: 'Admins'
            };
        }

        fillItems($('.monitorUsersList', page), users, 'chkMonitor', 'chkMonitor', notificationConfig.DisabledMonitorUsers);
        fillItems($('.sendToUsersList', page), users, 'chkSendTo', 'chkSendTo', notificationConfig.SendToUsers, true);
        fillItems($('.servicesList', page), services, 'chkService', 'chkService', notificationConfig.DisabledServices);
        $('#chkEnabled', page).prop('checked', notificationConfig.Enabled || false);
        $('#selectUsers', page).val(notificationConfig.SendToUserMode).trigger('change');
    });
}

function save(page) {
    const type = getParameterByName('type');
    const promise1 = ApiClient.getNamedConfiguration(notificationsConfigurationKey);
    // TODO: Check if this promise is really needed, as it's unused.
    const promise2 = ApiClient.getJSON(ApiClient.getUrl('Notifications/Types'));
    Promise.all([promise1, promise2]).then(function (responses) {
        const notificationOptions = responses[0];
        let notificationConfig = notificationOptions.Options.filter(function (n) {
            return n.Type == type;
        })[0];

        if (!notificationConfig) {
            notificationConfig = {
                Type: type
            };
            notificationOptions.Options.push(notificationConfig);
        }

        notificationConfig.Enabled = $('#chkEnabled', page).is(':checked');
        notificationConfig.SendToUserMode = $('#selectUsers', page).val();
        notificationConfig.DisabledMonitorUsers = $('.chkMonitor', page).get().filter(function (c) {
            return !c.checked;
        }).map(function (c) {
            return c.getAttribute('data-itemid');
        });
        notificationConfig.SendToUsers = $('.chkSendTo', page).get().filter(function (c) {
            return c.checked;
        }).map(function (c) {
            return c.getAttribute('data-itemid');
        });
        notificationConfig.DisabledServices = $('.chkService', page).get().filter(function (c) {
            return !c.checked;
        }).map(function (c) {
            return c.getAttribute('data-itemid');
        });
        ApiClient.updateNamedConfiguration(notificationsConfigurationKey, notificationOptions).then(function () {
            Dashboard.processServerConfigurationUpdateResult();
            Dashboard.navigate('notificationsettings.html');
        });
    });
}

function onSubmit() {
    save($(this).parents('.page'));
    return false;
}

const notificationsConfigurationKey = 'notifications';
$(document).on('pageinit', '#notificationSettingPage', function () {
    const page = this;
    $('#selectUsers', page).on('change', function () {
        if (this.value == 'Custom') {
            $('.selectCustomUsers', page).show();
        } else {
            $('.selectCustomUsers', page).hide();
        }
    });
    $('.notificationSettingForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#notificationSettingPage', function () {
    reload(this);
});
