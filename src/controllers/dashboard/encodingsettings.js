import 'jquery';
import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import libraryMenu from '../../scripts/libraryMenu';
import Dashboard from '../../utils/dashboard';
import alert from '../../components/alert';

function loadPage(page, config, systemInfo) {
    Array.prototype.forEach.call(page.querySelectorAll('.chkDecodeCodec'), function (c) {
        c.checked = (config.HardwareDecodingCodecs || []).indexOf(c.getAttribute('data-codec')) !== -1;
    });
    page.querySelector('#chkDecodingColorDepth10Hevc').checked = config.EnableDecodingColorDepth10Hevc;
    page.querySelector('#chkDecodingColorDepth10Vp9').checked = config.EnableDecodingColorDepth10Vp9;
    page.querySelector('#chkEnhancedNvdecDecoder').checked = config.EnableEnhancedNvdecDecoder;
    page.querySelector('#chkSystemNativeHwDecoder').checked = config.PreferSystemNativeHwDecoder;
    page.querySelector('#chkIntelLpH264HwEncoder').checked = config.EnableIntelLowPowerH264HwEncoder;
    page.querySelector('#chkIntelLpHevcHwEncoder').checked = config.EnableIntelLowPowerHevcHwEncoder;
    page.querySelector('#chkHardwareEncoding').checked = config.EnableHardwareEncoding;
    page.querySelector('#chkAllowHevcEncoding').checked = config.AllowHevcEncoding;
    page.querySelector('#chkAllowAv1Encoding').checked = config.AllowAv1Encoding;
    $('#selectVideoDecoder', page).val(config.HardwareAccelerationType);
    $('#selectThreadCount', page).val(config.EncodingThreadCount);
    page.querySelector('#chkEnableAudioVbr').checked = config.EnableAudioVbr;
    $('#txtDownMixAudioBoost', page).val(config.DownMixAudioBoost);
    $('#selectStereoDownmixAlgorithm').val(config.DownMixStereoAlgorithm || 'None');
    page.querySelector('#txtMaxMuxingQueueSize').value = config.MaxMuxingQueueSize || '';
    page.querySelector('.txtEncoderPath').value = config.EncoderAppPathDisplay || '';
    $('#txtTranscodingTempPath', page).val(systemInfo.TranscodingTempPath || '');
    page.querySelector('#txtFallbackFontPath').value = config.FallbackFontPath || '';
    page.querySelector('#chkEnableFallbackFont').checked = config.EnableFallbackFont;
    $('#txtVaapiDevice', page).val(config.VaapiDevice || '');
    page.querySelector('#chkTonemapping').checked = config.EnableTonemapping;
    page.querySelector('#chkVppTonemapping').checked = config.EnableVppTonemapping;
    page.querySelector('#chkVideoToolboxTonemapping').checked = config.EnableVideoToolboxTonemapping;
    page.querySelector('#selectTonemappingAlgorithm').value = config.TonemappingAlgorithm;
    page.querySelector('#selectTonemappingMode').value = config.TonemappingMode;
    page.querySelector('#selectTonemappingRange').value = config.TonemappingRange;
    page.querySelector('#txtTonemappingDesat').value = config.TonemappingDesat;
    page.querySelector('#txtTonemappingPeak').value = config.TonemappingPeak;
    page.querySelector('#txtTonemappingParam').value = config.TonemappingParam || '';
    page.querySelector('#txtVppTonemappingBrightness').value = config.VppTonemappingBrightness;
    page.querySelector('#txtVppTonemappingContrast').value = config.VppTonemappingContrast;
    page.querySelector('#selectEncoderPreset').value = config.EncoderPreset || '';
    page.querySelector('#txtH264Crf').value = config.H264Crf || '';
    page.querySelector('#txtH265Crf').value = config.H265Crf || '';
    page.querySelector('#selectDeinterlaceMethod').value = config.DeinterlaceMethod || '';
    page.querySelector('#chkDoubleRateDeinterlacing').checked = config.DeinterlaceDoubleRate;
    page.querySelector('#chkEnableSubtitleExtraction').checked = config.EnableSubtitleExtraction || false;
    page.querySelector('#chkEnableThrottling').checked = config.EnableThrottling || false;
    page.querySelector('#chkEnableSegmentDeletion').checked = config.EnableSegmentDeletion || false;
    page.querySelector('#txtThrottleDelaySeconds').value = config.ThrottleDelaySeconds || '';
    page.querySelector('#txtSegmentKeepSeconds').value = config.SegmentKeepSeconds || '';
    page.querySelector('#selectVideoDecoder').dispatchEvent(new CustomEvent('change', {
        bubbles: true
    }));
    loading.hide();
}

function onSaveEncodingPathFailure() {
    loading.hide();
    alert(globalize.translate('FFmpegSavePathNotFound'));
}

function updateEncoder(form) {
    return ApiClient.getSystemInfo().then(function () {
        return ApiClient.ajax({
            url: ApiClient.getUrl('System/MediaEncoder/Path'),
            type: 'POST',
            data: JSON.stringify({
                Path: form.querySelector('.txtEncoderPath').value,
                PathType: 'Custom'
            }),
            contentType: 'application/json'
        }).then(Dashboard.processServerConfigurationUpdateResult, onSaveEncodingPathFailure);
    });
}

function onSubmit() {
    const form = this;

    const onDecoderConfirmed = function () {
        loading.show();
        ApiClient.getNamedConfiguration('encoding').then(function (config) {
            config.EnableAudioVbr = form.querySelector('#chkEnableAudioVbr').checked;
            config.DownMixAudioBoost = $('#txtDownMixAudioBoost', form).val();
            config.DownMixStereoAlgorithm = $('#selectStereoDownmixAlgorithm', form).val() || 'None';
            config.MaxMuxingQueueSize = form.querySelector('#txtMaxMuxingQueueSize').value;
            config.TranscodingTempPath = $('#txtTranscodingTempPath', form).val();
            config.FallbackFontPath = form.querySelector('#txtFallbackFontPath').value;
            config.EnableFallbackFont = form.querySelector('#txtFallbackFontPath').value ? form.querySelector('#chkEnableFallbackFont').checked : false;
            config.EncodingThreadCount = $('#selectThreadCount', form).val();
            config.HardwareAccelerationType = $('#selectVideoDecoder', form).val();
            config.VaapiDevice = $('#txtVaapiDevice', form).val();
            config.EnableTonemapping = form.querySelector('#chkTonemapping').checked;
            config.EnableVppTonemapping = form.querySelector('#chkVppTonemapping').checked;
            config.EnableVideoToolboxTonemapping = form.querySelector('#chkVideoToolboxTonemapping').checked;
            config.TonemappingAlgorithm = form.querySelector('#selectTonemappingAlgorithm').value;
            config.TonemappingMode = form.querySelector('#selectTonemappingMode').value;
            config.TonemappingRange = form.querySelector('#selectTonemappingRange').value;
            config.TonemappingDesat = form.querySelector('#txtTonemappingDesat').value;
            config.TonemappingPeak = form.querySelector('#txtTonemappingPeak').value;
            config.TonemappingParam = form.querySelector('#txtTonemappingParam').value || '0';
            config.VppTonemappingBrightness = form.querySelector('#txtVppTonemappingBrightness').value;
            config.VppTonemappingContrast = form.querySelector('#txtVppTonemappingContrast').value;
            config.EncoderPreset = form.querySelector('#selectEncoderPreset').value;
            config.H264Crf = parseInt(form.querySelector('#txtH264Crf').value || '0', 10);
            config.H265Crf = parseInt(form.querySelector('#txtH265Crf').value || '0', 10);
            config.DeinterlaceMethod = form.querySelector('#selectDeinterlaceMethod').value;
            config.DeinterlaceDoubleRate = form.querySelector('#chkDoubleRateDeinterlacing').checked;
            config.EnableSubtitleExtraction = form.querySelector('#chkEnableSubtitleExtraction').checked;
            config.EnableThrottling = form.querySelector('#chkEnableThrottling').checked;
            config.EnableSegmentDeletion = form.querySelector('#chkEnableSegmentDeletion').checked;
            config.ThrottleDelaySeconds = parseInt(form.querySelector('#txtThrottleDelaySeconds').value || '0', 10);
            config.SegmentKeepSeconds = parseInt(form.querySelector('#txtSegmentKeepSeconds').value || '0', 10);
            config.HardwareDecodingCodecs = Array.prototype.map.call(Array.prototype.filter.call(form.querySelectorAll('.chkDecodeCodec'), function (c) {
                return c.checked;
            }), function (c) {
                return c.getAttribute('data-codec');
            });
            config.EnableDecodingColorDepth10Hevc = form.querySelector('#chkDecodingColorDepth10Hevc').checked;
            config.EnableDecodingColorDepth10Vp9 = form.querySelector('#chkDecodingColorDepth10Vp9').checked;
            config.EnableEnhancedNvdecDecoder = form.querySelector('#chkEnhancedNvdecDecoder').checked;
            config.PreferSystemNativeHwDecoder = form.querySelector('#chkSystemNativeHwDecoder').checked;
            config.EnableIntelLowPowerH264HwEncoder = form.querySelector('#chkIntelLpH264HwEncoder').checked;
            config.EnableIntelLowPowerHevcHwEncoder = form.querySelector('#chkIntelLpHevcHwEncoder').checked;
            config.EnableHardwareEncoding = form.querySelector('#chkHardwareEncoding').checked;
            config.AllowHevcEncoding = form.querySelector('#chkAllowHevcEncoding').checked;
            config.AllowAv1Encoding = form.querySelector('#chkAllowAv1Encoding').checked;
            ApiClient.updateNamedConfiguration('encoding', config).then(function () {
                updateEncoder(form);
            }, function () {
                alert(globalize.translate('ErrorDefault'));
                Dashboard.processServerConfigurationUpdateResult();
            });
        });
    };

    if ($('#selectVideoDecoder', form).val()) {
        alert({
            title: globalize.translate('TitleHardwareAcceleration'),
            text: globalize.translate('HardwareAccelerationWarning')
        }).then(onDecoderConfirmed);
    } else {
        onDecoderConfirmed();
    }

    return false;
}

function setDecodingCodecsVisible(context, value) {
    value = value || '';
    let any;
    Array.prototype.forEach.call(context.querySelectorAll('.chkDecodeCodec'), function (c) {
        if (c.getAttribute('data-types').split(',').indexOf(value) === -1) {
            dom.parentWithTag(c, 'LABEL').classList.add('hide');
        } else {
            dom.parentWithTag(c, 'LABEL').classList.remove('hide');
            any = true;
        }
    });

    if (any) {
        context.querySelector('.decodingCodecsList').classList.remove('hide');
    } else {
        context.querySelector('.decodingCodecsList').classList.add('hide');
    }
}

function getTabs() {
    return [{
        href: '#/dashboard/playback/transcoding',
        name: globalize.translate('Transcoding')
    }, {
        href: '#/dashboard/playback/resume',
        name: globalize.translate('ButtonResume')
    }, {
        href: '#/dashboard/playback/streaming',
        name: globalize.translate('TabStreaming')
    }, {
        href: '#/dashboard/playback/trickplay',
        name: globalize.translate('Trickplay')
    }];
}

let systemInfo;
function getSystemInfo() {
    return systemInfo ? Promise.resolve(systemInfo) : ApiClient.getPublicSystemInfo().then(
        info => {
            systemInfo = info;
            return info;
        }
    );
}

$(document).on('pageinit', '#encodingSettingsPage', function () {
    const page = this;
    getSystemInfo();
    page.querySelector('#selectVideoDecoder').addEventListener('change', function () {
        if (this.value == 'vaapi') {
            page.querySelector('.fldVaapiDevice').classList.remove('hide');
            page.querySelector('#txtVaapiDevice').setAttribute('required', 'required');
        } else {
            page.querySelector('.fldVaapiDevice').classList.add('hide');
            page.querySelector('#txtVaapiDevice').removeAttribute('required');
        }

        if (this.value == 'amf' || this.value == 'nvenc' || this.value == 'qsv' || this.value == 'vaapi' || this.value == 'rkmpp' || this.value == 'videotoolbox') {
            page.querySelector('.fld10bitHevcVp9HwDecoding').classList.remove('hide');
        } else {
            page.querySelector('.fld10bitHevcVp9HwDecoding').classList.add('hide');
        }

        if (this.value == 'amf' || this.value == 'nvenc' || this.value == 'qsv' || this.value == 'vaapi' || this.value == 'rkmpp' || this.value == 'videotoolbox') {
            page.querySelector('.tonemappingOptions').classList.remove('hide');
        } else {
            page.querySelector('.tonemappingOptions').classList.add('hide');
        }

        if (this.value == 'qsv' || this.value == 'vaapi') {
            page.querySelector('.fldIntelLp').classList.remove('hide');
        } else {
            page.querySelector('.fldIntelLp').classList.add('hide');
        }

        if (this.value === 'videotoolbox') {
            page.querySelector('.videoToolboxTonemappingOptions').classList.remove('hide');
        } else {
            page.querySelector('.videoToolboxTonemappingOptions').classList.add('hide');
        }

        if (this.value == 'qsv' || this.value == 'vaapi') {
            page.querySelector('.vppTonemappingOptions').classList.remove('hide');
        } else {
            page.querySelector('.vppTonemappingOptions').classList.add('hide');
        }

        if (this.value == 'qsv') {
            page.querySelector('.fldSysNativeHwDecoder').classList.remove('hide');
        } else {
            page.querySelector('.fldSysNativeHwDecoder').classList.add('hide');
        }

        if (this.value == 'nvenc') {
            page.querySelector('.fldEnhancedNvdec').classList.remove('hide');
        } else {
            page.querySelector('.fldEnhancedNvdec').classList.add('hide');
        }

        if (this.value) {
            page.querySelector('.hardwareAccelerationOptions').classList.remove('hide');
        } else {
            page.querySelector('.hardwareAccelerationOptions').classList.add('hide');
        }

        setDecodingCodecsVisible(page, this.value);
    });
    $('#btnSelectTranscodingTempPath', page).on('click.selectDirectory', function () {
        import('../../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                callback: function (path) {
                    if (path) {
                        $('#txtTranscodingTempPath', page).val(path);
                    }

                    picker.close();
                },
                validateWriteable: true,
                header: globalize.translate('HeaderSelectTranscodingPath'),
                instruction: globalize.translate('HeaderSelectTranscodingPathHelp')
            });
        });
    });
    $('#btnSelectFallbackFontPath', page).on('click.selectDirectory', function () {
        import('../../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                includeDirectories: true,
                callback: function (path) {
                    if (path) {
                        page.querySelector('#txtFallbackFontPath').value = path;
                    }

                    picker.close();
                },
                header: globalize.translate('HeaderSelectFallbackFontPath'),
                instruction: globalize.translate('HeaderSelectFallbackFontPathHelp')
            });
        });
    });
    $('.encodingSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#encodingSettingsPage', function () {
    loading.show();
    libraryMenu.setTabs('playback', 0, getTabs);
    const page = this;
    ApiClient.getNamedConfiguration('encoding').then(function (config) {
        ApiClient.getSystemInfo().then(function (fetchedSystemInfo) {
            loadPage(page, config, fetchedSystemInfo);
        });
    });
});

