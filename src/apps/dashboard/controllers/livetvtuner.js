import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import dom from 'utils/dom';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';
import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-select/emby-select';
import Dashboard from 'utils/dashboard';
import { getParameterByName } from 'utils/url';

function isM3uVariant(type) {
    return ['nextpvr'].indexOf(type || '') !== -1;
}

function fillTypes(view, currentId) {
    return ApiClient.getJSON(ApiClient.getUrl('LiveTv/TunerHosts/Types')).then((types) => {
        const selectType = view.querySelector('.selectType');
        let html = '';
        html += types
            .map((tuner) => {
                return '<option value="' + tuner.Id + '">' + tuner.Name + '</option>';
            })
            .join('');
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
        ApiClient.getNamedConfiguration('livetv').then((config) => {
            const info = config.TunerHosts.filter((i) => {
                return i.Id === providerId;
            })[0];
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
    view.querySelector('.txtFallbackMaxStreamingBitrate').value =
        info.FallbackMaxStreamingBitrate / 1e6 || '30';
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
        FallbackMaxStreamingBitrate: parseInt(
            1e6 * parseFloat(page.querySelector('.txtFallbackMaxStreamingBitrate').value || '30'),
            10
        ),
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
    }).then(
        () => {
            Dashboard.processServerConfigurationUpdateResult();
            Dashboard.navigate('dashboard/livetv');
        },
        () => {
            loading.hide();
            Dashboard.alert({
                message: globalize.translate('ErrorSavingTvProvider')
            });
        }
    );
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
    const mayIncludeUnsupportedDrmChannels = value === 'hdhomerun';
    const supportsTranscoding = value === 'hdhomerun';
    const supportsFavorites = value === 'hdhomerun';
    const supportsTunerIpAddress = value === 'hdhomerun';
    const supportsTunerFileOrUrl = value === 'm3u';
    const supportsStreamLooping = value === 'm3u';
    const supportsIgnoreDts = value === 'm3u';
    const supportsReadInputAtNativeFramerate = value === 'm3u';
    const supportsTunerCount = value === 'm3u';
    const supportsUserAgent = value === 'm3u';
    const supportsFmp4Container = value === 'm3u';
    const supportsStreamSharing = value === 'm3u';
    const supportsFallbackBitrate = value === 'm3u' || value === 'hdhomerun';
    const suppportsSubmit = value !== 'other';
    const supportsSelectablePath = supportsTunerFileOrUrl;
    const txtDevicePath = view.querySelector('.txtDevicePath');

    if (supportsTunerIpAddress) {
        txtDevicePath.label(globalize.translate('LabelTunerIpAddress'));
        view.querySelector('.fldPath').classList.remove('hide');
    } else if (supportsTunerFileOrUrl) {
        txtDevicePath.label(globalize.translate('LabelFileOrUrl'));
        view.querySelector('.fldPath').classList.remove('hide');
    } else {
        view.querySelector('.fldPath').classList.add('hide');
    }

    if (supportsSelectablePath) {
        view.querySelector('.btnSelectPath').classList.remove('hide');
        view.querySelector('.txtDevicePath').setAttribute('required', 'required');
    } else {
        view.querySelector('.btnSelectPath').classList.add('hide');
        view.querySelector('.txtDevicePath').removeAttribute('required');
    }

    if (supportsUserAgent) {
        view.querySelector('.fldUserAgent').classList.remove('hide');
    } else {
        view.querySelector('.fldUserAgent').classList.add('hide');
    }

    if (supportsFavorites) {
        view.querySelector('.fldFavorites').classList.remove('hide');
    } else {
        view.querySelector('.fldFavorites').classList.add('hide');
    }

    if (supportsTranscoding) {
        view.querySelector('.fldTranscode').classList.remove('hide');
    } else {
        view.querySelector('.fldTranscode').classList.add('hide');
    }

    view.querySelector('.fldFmp4Container').classList.toggle('hide', !supportsFmp4Container);
    view.querySelector('.fldStreamSharing').classList.toggle('hide', !supportsStreamSharing);
    view.querySelector('.fldFallbackMaxStreamingBitrate').classList.toggle(
        'hide',
        !supportsFallbackBitrate
    );

    if (supportsStreamLooping) {
        view.querySelector('.fldStreamLoop').classList.remove('hide');
    } else {
        view.querySelector('.fldStreamLoop').classList.add('hide');
    }

    if (supportsIgnoreDts) {
        view.querySelector('.fldIgnoreDts').classList.remove('hide');
    } else {
        view.querySelector('.fldIgnoreDts').classList.add('hide');
    }

    view.querySelector('.fldReadInputAtNativeFramerate').classList.toggle(
        'hide',
        !supportsReadInputAtNativeFramerate
    );

    if (supportsTunerCount) {
        view.querySelector('.fldTunerCount').classList.remove('hide');
        view.querySelector('.txtTunerCount').setAttribute('required', 'required');
    } else {
        view.querySelector('.fldTunerCount').classList.add('hide');
        view.querySelector('.txtTunerCount').removeAttribute('required');
    }

    if (mayIncludeUnsupportedDrmChannels) {
        view.querySelector('.drmMessage').classList.remove('hide');
    } else {
        view.querySelector('.drmMessage').classList.add('hide');
    }

    if (suppportsSubmit) {
        view.querySelector('.button-submit').classList.remove('hide');
    } else {
        view.querySelector('.button-submit').classList.add('hide');
    }
}

export default function (view, params) {
    if (!params.id) {
        view.querySelector('.btnDetect').classList.remove('hide');
    }

    view.addEventListener('viewshow', () => {
        const currentId = params.id;
        fillTypes(view, currentId).then(() => {
            reload(view, currentId);
        });
    });
    view.querySelector('form').addEventListener('submit', (e) => {
        submitForm(view);
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    view.querySelector('.selectType').addEventListener('change', onTypeChange);
    view.querySelector('.btnDetect').addEventListener('click', () => {
        getDetectedDevice().then((info) => {
            fillTunerHostInfo(view, info);
        });
    });
    view.querySelector('.btnSelectPath').addEventListener('click', () => {
        import('components/directorybrowser/directorybrowser').then(
            ({ default: DirectoryBrowser }) => {
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
            }
        );
    });
}
