import globalize from 'lib/globalize';
import loading from 'components/loading/loading';
import dom from 'utils/dom';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';
import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-select/emby-select';
import Dashboard from 'utils/dashboard';
import { getParameterByName } from 'utils/url';

function isM3uVariant(type) {
    return ['nextpvr'].includes(type || '');
}

function fillTypes(view, currentId) {
    return ApiClient.getJSON(ApiClient.getUrl('LiveTv/TunerHosts/Types')).then(function (types) {
        const selectType = view.querySelector('.selectType');
        let html = '';
        html += types.map(function (tuner) {
            return '<option value="' + tuner.Id + '">' + tuner.Name + '</option>';
        }).join('');
        html += '<option value="other">';
        html += globalize.translate('TabOther');
        html += '</option>';
        selectType.innerHTML = html;
        selectType.disabled = currentId != null;
        selectType.value = '';
        onTypeChange.call(selectType);
    });
}

function reload(view, providerId) {
    view.querySelector('.txtDevicePath').value = '';
    view.querySelector('.chkFavorite').checked = false;
    view.querySelector('.txtDevicePath').value = '';

    if (providerId) {
        ApiClient.getNamedConfiguration('livetv').then(function (config) {
            const info = config.TunerHosts.find((i) => i.Id === providerId);
            fillTunerHostInfo(view, info);
        });
    }
}

function fillTunerHostInfo(view, info) {
    const selectType = view.querySelector('.selectType');
    let type = info.Type || '';

    if (info.Source && isM3uVariant(info.Source)) {
        type = info.Source;
    }

    selectType.value = type;
    onTypeChange.call(selectType);
    view.querySelector('.txtDevicePath').value = info.Url || '';
    view.querySelector('.txtFriendlyName').value = info.FriendlyName || '';
    view.querySelector('.txtUserAgent').value = info.UserAgent || '';
    view.querySelector('.fldDeviceId').value = info.DeviceId || '';
    view.querySelector('.chkFavorite').checked = info.ImportFavoritesOnly;
    view.querySelector('.chkTranscode').checked = info.AllowHWTranscoding;
    view.querySelector('.chkStreamLoop').checked = info.EnableStreamLooping;
    view.querySelector('.chkFmp4Container').checked = info.AllowFmp4TranscodingContainer;
    view.querySelector('.chkStreamSharing').checked = info.AllowStreamSharing;
    view.querySelector('.chkIgnoreDts').checked = info.IgnoreDts;
    view.querySelector('.chkReadInputAtNativeFramerate').checked = info.ReadAtNativeFramerate;
    view.querySelector('.txtFallbackMaxStreamingBitrate').value = info.FallbackMaxStreamingBitrate / 1e6 || '30';
    view.querySelector('.txtTunerCount').value = info.TunerCount || '0';
}

function submitForm(page) {
    loading.show();
    const info = {
        Type: page.querySelector('.selectType').value,
        Url: page.querySelector('.txtDevicePath').value || null,
        UserAgent: page.querySelector('.txtUserAgent').value || null,
        FriendlyName: page.querySelector('.txtFriendlyName').value || null,
        DeviceId: page.querySelector('.fldDeviceId').value || null,
        TunerCount: page.querySelector('.txtTunerCount').value || 0,
        FallbackMaxStreamingBitrate: Number.parseInt(1e6 * Number.parseFloat(page.querySelector('.txtFallbackMaxStreamingBitrate').value || '30'), 10),
        ImportFavoritesOnly: page.querySelector('.chkFavorite').checked,
        AllowHWTranscoding: page.querySelector('.chkTranscode').checked,
        AllowFmp4TranscodingContainer: page.querySelector('.chkFmp4Container').checked,
        AllowStreamSharing: page.querySelector('.chkStreamSharing').checked,
        EnableStreamLooping: page.querySelector('.chkStreamLoop').checked,
        IgnoreDts: page.querySelector('.chkIgnoreDts').checked,
        ReadAtNativeFramerate: page.querySelector('.chkReadInputAtNativeFramerate').checked
    };

    if (isM3uVariant(info.Type)) {
        info.Source = info.Type;
        info.Type = 'm3u';
    }

    if (getParameterByName('id')) {
        info.Id = getParameterByName('id');
    }

    ApiClient.ajax({
        type: 'POST',
        url: ApiClient.getUrl('LiveTv/TunerHosts'),
        data: JSON.stringify(info),
        contentType: 'application/json'
    }).then(function () {
        Dashboard.processServerConfigurationUpdateResult();
        Dashboard.navigate('dashboard/livetv');
    }, function () {
        loading.hide();
        Dashboard.alert({
            message: globalize.translate('ErrorSavingTvProvider')
        });
    });
}

function getDetectedDevice() {
    return import('components/tunerPicker').then(({ default: TunerPicker }) => {
        return new TunerPicker().show({
            serverId: ApiClient.serverId()
        });
    });
}

function onTypeChange() {
    const value = this.value;
    const view = dom.parentWithClass(this, 'page');

    const flags = {
        mayIncludeUnsupportedDrmChannels: value === 'hdhomerun',
        supportsTranscoding: value === 'hdhomerun',
        supportsFavorites: value === 'hdhomerun',
        supportsTunerIpAddress: value === 'hdhomerun',
        supportsTunerFileOrUrl: value === 'm3u',
        supportsStreamLooping: value === 'm3u',
        supportsIgnoreDts: value === 'm3u',
        supportsReadInputAtNativeFramerate: value === 'm3u',
        supportsTunerCount: value === 'm3u',
        supportsUserAgent: value === 'm3u',
        supportsFmp4Container: value === 'm3u',
        supportsStreamSharing: value === 'm3u',
        supportsFallbackBitrate: value === 'm3u' || value === 'hdhomerun',
        supportsSubmit: value !== 'other'
    };

    const txtDevicePath = view.querySelector('.txtDevicePath');

    // Path label and fldPath visibility
    const fldPath = view.querySelector('.fldPath');
    if (flags.supportsTunerIpAddress) {
        txtDevicePath.label(globalize.translate('LabelTunerIpAddress'));
        fldPath.classList.remove('hide');
    } else if (flags.supportsTunerFileOrUrl) {
        txtDevicePath.label(globalize.translate('LabelFileOrUrl'));
        fldPath.classList.remove('hide');
    } else {
        fldPath.classList.add('hide');
    }

    // Selectable path button and required attribute
    if (flags.supportsTunerFileOrUrl) {
        view.querySelector('.btnSelectPath').classList.remove('hide');
        txtDevicePath.setAttribute('required', 'required');
    } else {
        view.querySelector('.btnSelectPath').classList.add('hide');
        txtDevicePath.removeAttribute('required');
    }

    // Generic show/hide map for single-flag controlled fields
    const singleFlagMap = [
        { selector: '.fldUserAgent', flag: 'supportsUserAgent' },
        { selector: '.fldFavorites', flag: 'supportsFavorites' },
        { selector: '.fldTranscode', flag: 'supportsTranscoding' },
        { selector: '.fldStreamLoop', flag: 'supportsStreamLooping' },
        { selector: '.fldIgnoreDts', flag: 'supportsIgnoreDts' },
        { selector: '.drmMessage', flag: 'mayIncludeUnsupportedDrmChannels' },
        { selector: '.button-submit', flag: 'supportsSubmit' }
    ];

    singleFlagMap.forEach(({ selector, flag }) => {
        const element = view.querySelector(selector);
        if (!element) {
            return;
        }
        element.classList.toggle('hide', !flags[flag]);
    });

    // Toggle-based fields (use .toggle with boolean)
    view.querySelector('.fldFmp4Container').classList.toggle('hide', !flags.supportsFmp4Container);
    view.querySelector('.fldStreamSharing').classList.toggle('hide', !flags.supportsStreamSharing);
    view.querySelector('.fldFallbackMaxStreamingBitrate').classList.toggle('hide', !flags.supportsFallbackBitrate);
    view.querySelector('.fldReadInputAtNativeFramerate').classList.toggle('hide', !flags.supportsReadInputAtNativeFramerate);

    // Tuner count visibility & required
    const tunerCountEl = view.querySelector('.fldTunerCount');
    const txtTunerCount = view.querySelector('.txtTunerCount');
    if (flags.supportsTunerCount) {
        tunerCountEl.classList.remove('hide');
        txtTunerCount.setAttribute('required', 'required');
    } else {
        tunerCountEl.classList.add('hide');
        txtTunerCount.removeAttribute('required');
    }
}

export default function (view, params) {
    if (!params.id) {
        view.querySelector('.btnDetect').classList.remove('hide');
    }

    view.addEventListener('viewshow', function () {
        const currentId = params.id;
        fillTypes(view, currentId).then(function () {
            reload(view, currentId);
        });
    });
    view.querySelector('form').addEventListener('submit', function (e) {
        submitForm(view);
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    view.querySelector('.selectType').addEventListener('change', onTypeChange);
    view.querySelector('.btnDetect').addEventListener('click', function () {
        getDetectedDevice().then(function (info) {
            fillTunerHostInfo(view, info);
        });
    });
    view.querySelector('.btnSelectPath').addEventListener('click', function () {
        import('components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                includeFiles: true,
                callback: function (path) {
                    if (path) {
                        view.querySelector('.txtDevicePath').value = path;
                    }

                    picker.close();
                }
            });
        });
    });
}
