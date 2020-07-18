define(['jQuery', 'emby-checkbox'], function ($) {
    'use strict';

    function fillItems(elem, items, cssClass, idPrefix, currentList, isEnabledList) {
        var html = '<div class="checkboxList paperList" style="padding: .5em 1em;">';
        html += items.map(function (u) {
            var isChecked = isEnabledList ? currentList.indexOf(u.Id) != -1 : currentList.indexOf(u.Id) == -1;
            var checkedHtml = isChecked ? ' checked="checked"' : '';
            return '<label><input is="emby-checkbox" class="' + cssClass + '" type="checkbox" data-itemid="' + u.Id + '"' + checkedHtml + '/><span>' + u.Name + '</span></label>';
        }).join('');
        html += '</div>';
        elem.innerHtml = html;
        elem.dispatchEvent(new Event('create'));
    }

    function reload(page) {
        var type = getParameterByName('type');
        var promise1 = ApiClient.getUsers();
        var promise2 = ApiClient.getNamedConfiguration(notificationsConfigurationKey);
        var promise3 = ApiClient.getJSON(ApiClient.getUrl('Notifications/Types'));
        var promise4 = ApiClient.getJSON(ApiClient.getUrl('Notifications/Services'));
        Promise.all([promise1, promise2, promise3, promise4]).then(function (responses) {
            var users = responses[0];
            var notificationOptions = responses[1];
            var types = responses[2];
            var services = responses[3];
            var notificationConfig = notificationOptions.Options.filter(function (n) {
                return n.Type == type;
            })[0];
            var typeInfo = types.filter(function (n) {
                return n.Type == type;
            })[0] || {};

            if (typeInfo.IsBasedOnUserEvent) {
                page.querySelector('.monitorUsers').classList.remove('hide');
            } else {
                page.querySelector('.monitorUsers').classList.add('hide');
            }

            page.querySelector('.notificationType').innerHtml = typeInfo.Name || 'Unknown Notification';

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
            page.querySelector('#chkEnabled').checked = notificationConfig.Enabled || false;
            page.querySelector('#selectUsers').value = notificationConfig.SendToUserMode;
            page.querySelector('#selectUsers').dispatchEvent(new Event('change'));
        });
    }

    function save(page) {
        var type = getParameterByName('type');
        var promise1 = ApiClient.getNamedConfiguration(notificationsConfigurationKey);
        // TODO: Check if this promise is really needed, as it's unused.
        var promise2 = ApiClient.getJSON(ApiClient.getUrl('Notifications/Types'));
        Promise.all([promise1, promise2]).then(function (responses) {
            var notificationOptions = responses[0];
            var notificationConfig = notificationOptions.Options.filter(function (n) {
                return n.Type == type;
            })[0];

            if (!notificationConfig) {
                notificationConfig = {
                    Type: type
                };
                notificationOptions.Options.push(notificationConfig);
            }

            notificationConfig.Enabled = page.querySelector('#chkEnabled').matches(':checked');
            notificationConfig.SendToUserMode = page.querySelector('#selectUsers').value;
            notificationConfig.DisabledMonitorUsers = Array.prototype.filter.call(page.querySelectorAll('.chkMonitor'), function (c) {
                return !c.checked;
            }).map(function (c) {
                return c.getAttribute('data-itemid');
            });
            notificationConfig.SendToUsers = Array.prototype.filter.call(page.querySelectorAll('.chkSendTo'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-itemid');
            });
            notificationConfig.DisabledServices = Array.prototype.filter.call(page.querySelectorAll('.chkService'), function (c) {
                return !c.checked;
            }).map(function (c) {
                return c.getAttribute('data-itemid');
            });
            ApiClient.updateNamedConfiguration(notificationsConfigurationKey, notificationOptions).then(function (r) {
                Dashboard.processServerConfigurationUpdateResult();
                Dashboard.navigate('notificationsettings.html');
            });
        });
    }

    function onSubmit() {
        save(this.closest('.page'));
        return false;
    }

    var notificationsConfigurationKey = 'notifications';
    $(document).on('pageinit', '#notificationSettingPage', function () {
        var page = this;
        $('#selectUsers', page).on('change', function () {
            if ('Custom' == this.value) {
                page.querySelector('.selectCustomUsers').classList.remove('hide');
            } else {
                page.querySelector('.selectCustomUsers').classList.add('hide');
            }
        });
        $('.notificationSettingForm').off('submit', onSubmit).on('submit', onSubmit);
    }).on('pageshow', '#notificationSettingPage', function () {
        reload(this);
    });
});
