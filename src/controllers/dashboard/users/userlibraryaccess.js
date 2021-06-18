import loading from '../../../components/loading/loading';
import libraryMenu from '../../../scripts/libraryMenu';
import globalize from '../../../scripts/globalize';
import Dashboard from '../../../scripts/clientUtils';
import toast from '../../../components/toast/toast';

function triggerChange(select) {
    const evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, true);
    select.dispatchEvent(evt);
}

function loadMediaFolders(page, user, mediaFolders) {
    let html = '';
    html += '<h3 class="checkboxListLabel">' + globalize.translate('HeaderLibraries') + '</h3>';
    html += '<div class="checkboxList paperList checkboxList-paperList">';

    for (let i = 0, length = mediaFolders.length; i < length; i++) {
        const folder = mediaFolders[i];
        const isChecked = user.Policy.EnableAllFolders || user.Policy.EnabledFolders.indexOf(folder.Id) != -1;
        const checkedAttribute = isChecked ? ' checked="checked"' : '';
        html += '<label><input type="checkbox" is="emby-checkbox" class="chkFolder" data-id="' + folder.Id + '" ' + checkedAttribute + '><span>' + folder.Name + '</span></label>';
    }

    html += '</div>';
    page.querySelector('.folderAccess').innerHTML = html;
    const chkEnableAllFolders = page.querySelector('#chkEnableAllFolders');
    chkEnableAllFolders.checked = user.Policy.EnableAllFolders;
    triggerChange(chkEnableAllFolders);
}

function loadChannels(page, user, channels) {
    let html = '';
    html += '<h3 class="checkboxListLabel">' + globalize.translate('Channels') + '</h3>';
    html += '<div class="checkboxList paperList checkboxList-paperList">';

    for (let i = 0, length = channels.length; i < length; i++) {
        const folder = channels[i];
        const isChecked = user.Policy.EnableAllChannels || user.Policy.EnabledChannels.indexOf(folder.Id) != -1;
        const checkedAttribute = isChecked ? ' checked="checked"' : '';
        html += '<label><input type="checkbox" is="emby-checkbox" class="chkChannel" data-id="' + folder.Id + '" ' + checkedAttribute + '><span>' + folder.Name + '</span></label>';
    }

    html += '</div>';
    const channelAccess = page.querySelector('.channelAccess');
    channelAccess.innerHTML = html;

    if (channels.length) {
        page.querySelector('.channelAccessContainer').classList.remove('hide');
    } else {
        page.querySelector('.channelAccessContainer').classList.add('hide');
    }

    const chkEnableAllChannels = page.querySelector('#chkEnableAllChannels');
    chkEnableAllChannels.checked = user.Policy.EnableAllChannels;
    triggerChange(chkEnableAllChannels);
}

function loadDevices(page, user, devices) {
    let html = '';
    html += '<h3 class="checkboxListLabel">' + globalize.translate('HeaderDevices') + '</h3>';
    html += '<div class="checkboxList paperList checkboxList-paperList">';

    for (let i = 0, length = devices.length; i < length; i++) {
        const device = devices[i];
        const checkedAttribute = user.Policy.EnableAllDevices || user.Policy.EnabledDevices.indexOf(device.Id) != -1 ? ' checked="checked"' : '';
        html += '<label><input type="checkbox" is="emby-checkbox" class="chkDevice" data-id="' + device.Id + '" ' + checkedAttribute + '><span>' + device.Name + ' - ' + device.AppName + '</span></label>';
    }

    html += '</div>';

    const deviceAccess = page.querySelector('.deviceAccess');
    deviceAccess.innerHTML = html;

    const chkEnableAllDevices = page.querySelector('#chkEnableAllDevices');
    chkEnableAllDevices.checked = user.Policy.EnableAllDevices;
    triggerChange(chkEnableAllDevices);

    if (user.Policy.IsAdministrator) {
        page.querySelector('.deviceAccessContainer').classList.add('hide');
    } else {
        page.querySelector('.deviceAccessContainer').classList.remove('hide');
    }
}

function loadUser(page, user, loggedInUser, mediaFolders, channels, devices) {
    page.querySelector('.username').innerHTML = user.Name;
    libraryMenu.setTitle(user.Name);
    loadChannels(page, user, channels);
    loadMediaFolders(page, user, mediaFolders);
    loadDevices(page, user, devices);
    loading.hide();
}

function onSaveComplete() {
    loading.hide();
    toast(globalize.translate('SettingsSaved'));
}

function saveUser(user, page) {
    user.Policy.EnableAllFolders = page.querySelector('#chkEnableAllFolders').checked;
    user.Policy.EnabledFolders = user.Policy.EnableAllFolders ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (c) {
        return c.checked;
    }).map(function (c) {
        return c.getAttribute('data-id');
    });
    user.Policy.EnableAllChannels = page.querySelector('#chkEnableAllChannels').checked;
    user.Policy.EnabledChannels = user.Policy.EnableAllChannels ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkChannel'), function (c) {
        return c.checked;
    }).map(function (c) {
        return c.getAttribute('data-id');
    });
    user.Policy.EnableAllDevices = page.querySelector('#chkEnableAllDevices').checked;
    user.Policy.EnabledDevices = user.Policy.EnableAllDevices ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkDevice'), function (c) {
        return c.checked;
    }).map(function (c) {
        return c.getAttribute('data-id');
    });
    user.Policy.BlockedChannels = null;
    user.Policy.BlockedMediaFolders = null;
    ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
        onSaveComplete();
    });
}

function onSubmit(e) {
    const page = this.closest('#userLibraryAccessPage');
    loading.show();
    const userId = getParameterByName('userId');
    ApiClient.getUser(userId).then(function (result) {
        saveUser(result, page);
    });
    e.preventDefault();
    e.stopPropagation();
    return false;
}

export default function (view) {
    view.querySelector('#chkEnableAllDevices').addEventListener('change', function () {
        if (this.checked) {
            view.querySelector('.deviceAccessListContainer').classList.add('hide');
        } else {
            view.querySelector('.deviceAccessListContainer').classList.remove('hide');
        }
    });
    view.querySelector('#chkEnableAllChannels').addEventListener('change', function () {
        if (this.checked) {
            view.querySelector('.channelAccessListContainer').classList.add('hide');
        } else {
            view.querySelector('.channelAccessListContainer').classList.remove('hide');
        }
    });
    view.querySelector('#chkEnableAllFolders').addEventListener('change', function () {
        if (this.checked) {
            view.querySelector('.folderAccessListContainer').classList.add('hide');
        } else {
            view.querySelector('.folderAccessListContainer').classList.remove('hide');
        }
    });

    view.querySelector('.userLibraryAccessForm').addEventListener('submit', onSubmit);

    view.addEventListener('viewshow', function () {
        const page = this;
        loading.show();
        let promise1;
        const userId = getParameterByName('userId');

        if (userId) {
            promise1 = ApiClient.getUser(userId);
        } else {
            promise1 = Promise.resolve({
                Configuration: {}
            });
        }

        const promise2 = Dashboard.getCurrentUser();
        const promise4 = ApiClient.getJSON(ApiClient.getUrl('Library/MediaFolders', {
            IsHidden: false
        }));
        const promise5 = ApiClient.getJSON(ApiClient.getUrl('Channels'));
        const promise6 = ApiClient.getJSON(ApiClient.getUrl('Devices'));
        Promise.all([promise1, promise2, promise4, promise5, promise6]).then(function (responses) {
            loadUser(page, responses[0], responses[1], responses[2].Items, responses[3].Items, responses[4].Items);
        });
    });
}

