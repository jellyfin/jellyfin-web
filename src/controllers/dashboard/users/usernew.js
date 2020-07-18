define(['jQuery', 'loading', 'globalize', 'emby-checkbox'], function ($, loading, globalize) {
    'use strict';

    function loadMediaFolders(page, mediaFolders) {
        var html = '';
        html += '<h3 class="checkboxListLabel">' + globalize.translate('HeaderLibraries') + '</h3>';
        html += '<div class="checkboxList paperList" style="padding:.5em 1em;">';

        for (var i = 0; i < mediaFolders.length; i++) {
            var folder = mediaFolders[i];
            html += '<label><input type="checkbox" is="emby-checkbox" class="chkFolder" data-id="' + folder.Id + '"/><span>' + folder.Name + '</span></label>';
        }

        html += '</div>';
        const folderAccess = page.querySelector('.folderAccess');
        folderAccess.innerHtml = html;
        folderAccess.dispatchEvent(new Event('create'));
        page.querySelector('#chkEnableAllFolders').checked = false;
    }

    function loadChannels(page, channels) {
        var html = '';
        html += '<h3 class="checkboxListLabel">' + globalize.translate('HeaderChannels') + '</h3>';
        html += '<div class="checkboxList paperList" style="padding:.5em 1em;">';

        for (var i = 0; i < channels.length; i++) {
            var folder = channels[i];
            html += '<label><input type="checkbox" is="emby-checkbox" class="chkChannel" data-id="' + folder.Id + '"/><span>' + folder.Name + '</span></label>';
        }

        html += '</div>';
        const channelAccess = page.querySelector('.channelAccess');
        channelAccess.classList.remove('hide');
        channelAccess.innerHtml = html;
        channelAccess.dispatchEvent(new Event('create'));

        if (channels.length) {
            page.querySelector('.channelAccessContainer').classList.remove('hide');
        } else {
            page.querySelector('.channelAccessContainer').classList.add('hide');
        }

        page.querySelector('#chkEnableAllChannels').checked = false;
    }

    function loadUser(page) {
        page.querySelector('#txtUsername').value = '';
        page.querySelector('#txtPassword').value = '';
        loading.show();
        var promiseFolders = ApiClient.getJSON(ApiClient.getUrl('Library/MediaFolders', {
            IsHidden: false
        }));
        var promiseChannels = ApiClient.getJSON(ApiClient.getUrl('Channels'));
        Promise.all([promiseFolders, promiseChannels]).then(function (responses) {
            loadMediaFolders(page, responses[0].Items);
            loadChannels(page, responses[1].Items);
            loading.hide();
        });
    }

    function saveUser(page) {
        var user = {};
        user.Name = page.querySelector('#txtUsername').value;
        user.Password = page.querySelector('#txtPassword').value;
        ApiClient.createUser(user).then(function (user) {
            user.Policy.EnableAllFolders = page.querySelector('#chkEnableAllFolders').matches(':checked');
            user.Policy.EnabledFolders = [];

            if (!user.Policy.EnableAllFolders) {
                user.Policy.EnabledFolders = Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (i) {
                    return i.checked;
                }).map(function (i) {
                    return i.getAttribute('data-id');
                });
            }

            user.Policy.EnableAllChannels = $('#chkEnableAllChannels', page).matches(':checked');
            user.Policy.EnabledChannels = [];

            if (!user.Policy.EnableAllChannels) {
                user.Policy.EnabledChannels = Array.prototype.filter.call(page.querySelectorAll('.chkChannel'), function (i) {
                    return i.checked;
                }).map(function (i) {
                    return i.getAttribute('data-id');
                });
            }

            ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                Dashboard.navigate('useredit.html?userId=' + user.Id);
            });
        }, function (response) {
            require(['toast'], function (toast) {
                toast(globalize.translate('DefaultErrorMessage'));
            });

            loading.hide();
        });
    }

    function onSubmit() {
        var page = this.closest('.page');
        loading.show();
        saveUser(page);
        return false;
    }

    function loadData(page) {
        loadUser(page);
    }

    $(document).on('pageinit', '#newUserPage', function () {
        var page = this;
        $('#chkEnableAllChannels', page).on('change', function () {
            if (this.checked) {
                page.querySelector('.channelAccessListContainer').classList.add('hide');
            } else {
                page.querySelector('.channelAccessListContainer').classList.remove('hide');
            }
        });
        $('#chkEnableAllFolders', page).on('change', function () {
            if (this.checked) {
                page.querySelector('.folderAccessListContainer').classList.add('hide');
            } else {
                page.querySelector('.folderAccessListContainer').classList.remove('hide');
            }
        });
        $('.newUserProfileForm').off('submit', onSubmit).on('submit', onSubmit);
    }).on('pageshow', '#newUserPage', function () {
        loadData(this);
    });
});
