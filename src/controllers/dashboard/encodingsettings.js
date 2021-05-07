import 'jquery';
import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import libraryMenu from '../../scripts/libraryMenu';
import Dashboard from '../../scripts/clientUtils';
import alert from '../../components/alert';

/* eslint-disable indent */

    function loadPage(page, config, systemInfo) {
        Array.prototype.forEach.call(page.querySelectorAll('.chkDecodeCodec'), function (c) {
            c.checked = (config.HardwareDecodingCodecs || []).indexOf(c.getAttribute('data-codec')) !== -1;
        });
        page.querySelector('#chkDecodingColorDepth10Hevc').checked = config.EnableDecodingColorDepth10Hevc;
        page.querySelector('#chkDecodingColorDepth10Vp9').checked = config.EnableDecodingColorDepth10Vp9;
        page.querySelector('#chkEnhancedNvdecDecoder').checked = config.EnableEnhancedNvdecDecoder;
        page.querySelector('#chkHardwareEncoding').checked = config.EnableHardwareEncoding;
        page.querySelector('#chkAllowHevcEncoding').checked = config.AllowHevcEncoding;
        $('#selectVideoDecoder', page).val(config.HardwareAccelerationType);
        $('#selectThreadCount', page).val(config.EncodingThreadCount);
        $('#txtDownMixAudioBoost', page).val(config.DownMixAudioBoost);
        page.querySelector('#txtMaxMuxingQueueSize').value = config.MaxMuxingQueueSize || '';
        page.querySelector('.txtEncoderPath').value = config.EncoderAppPathDisplay || '';
        $('#txtTranscodingTempPath', page).val(systemInfo.TranscodingTempPath || '');
        page.querySelector('#txtFallbackFontPath').value = config.FallbackFontPath || '';
        page.querySelector('#chkEnableFallbackFont').checked = config.EnableFallbackFont;
        $('#txtVaapiDevice', page).val(config.VaapiDevice || '');
        page.querySelector('#chkTonemapping').checked = config.EnableTonemapping;
        page.querySelector('#chkVppTonemapping').checked = config.EnableVppTonemapping;
        page.querySelector('#txtOpenclDevice').value = config.OpenclDevice || '';
        page.querySelector('#selectTonemappingAlgorithm').value = config.TonemappingAlgorithm;
        page.querySelector('#selectTonemappingRange').value = config.TonemappingRange;
        page.querySelector('#txtTonemappingDesat').value = config.TonemappingDesat;
        page.querySelector('#txtTonemappingThreshold').value = config.TonemappingThreshold;
        page.querySelector('#txtTonemappingPeak').value = config.TonemappingPeak;
        page.querySelector('#txtTonemappingParam').value = config.TonemappingParam || '';
        page.querySelector('#selectEncoderPreset').value = config.EncoderPreset || '';
        page.querySelector('#txtH264Crf').value = config.H264Crf || '';
        page.querySelector('#txtH265Crf').value = config.H265Crf || '';
        page.querySelector('#selectDeinterlaceMethod').value = config.DeinterlaceMethod || '';
        page.querySelector('#chkDoubleRateDeinterlacing').checked = config.DeinterlaceDoubleRate;
        page.querySelector('#chkEnableSubtitleExtraction').checked = config.EnableSubtitleExtraction || false;
        page.querySelector('#chkEnableThrottling').checked = config.EnableThrottling || false;
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
                config.DownMixAudioBoost = $('#txtDownMixAudioBoost', form).val();
                config.MaxMuxingQueueSize = form.querySelector('#txtMaxMuxingQueueSize').value;
                config.TranscodingTempPath = $('#txtTranscodingTempPath', form).val();
                config.FallbackFontPath = form.querySelector('#txtFallbackFontPath').value;
                config.EnableFallbackFont = form.querySelector('#txtFallbackFontPath').value ? form.querySelector('#chkEnableFallbackFont').checked : false;
                config.EncodingThreadCount = $('#selectThreadCount', form).val();
                config.HardwareAccelerationType = $('#selectVideoDecoder', form).val();
                config.VaapiDevice = $('#txtVaapiDevice', form).val();
                config.OpenclDevice = form.querySelector('#txtOpenclDevice').value;
                config.EnableTonemapping = form.querySelector('#chkTonemapping').checked;
                config.EnableVppTonemapping = form.querySelector('#chkVppTonemapping').checked;
                config.TonemappingAlgorithm = form.querySelector('#selectTonemappingAlgorithm').value;
                config.TonemappingRange = form.querySelector('#selectTonemappingRange').value;
                config.TonemappingDesat = form.querySelector('#txtTonemappingDesat').value;
                config.TonemappingThreshold = form.querySelector('#txtTonemappingThreshold').value;
                config.TonemappingPeak = form.querySelector('#txtTonemappingPeak').value;
                config.TonemappingParam = form.querySelector('#txtTonemappingParam').value || '0';
                config.EncoderPreset = form.querySelector('#selectEncoderPreset').value;
                config.H264Crf = parseInt(form.querySelector('#txtH264Crf').value || '0');
                config.H265Crf = parseInt(form.querySelector('#txtH265Crf').value || '0');
                config.DeinterlaceMethod = form.querySelector('#selectDeinterlaceMethod').value;
                config.DeinterlaceDoubleRate = form.querySelector('#chkDoubleRateDeinterlacing').checked;
                config.EnableSubtitleExtraction = form.querySelector('#chkEnableSubtitleExtraction').checked;
                config.EnableThrottling = form.querySelector('#chkEnableThrottling').checked;
                config.HardwareDecodingCodecs = Array.prototype.map.call(Array.prototype.filter.call(form.querySelectorAll('.chkDecodeCodec'), function (c) {
                    return c.checked;
                }), function (c) {
                    return c.getAttribute('data-codec');
                });
                config.EnableDecodingColorDepth10Hevc = form.querySelector('#chkDecodingColorDepth10Hevc').checked;
                config.EnableDecodingColorDepth10Vp9 = form.querySelector('#chkDecodingColorDepth10Vp9').checked;
                config.EnableEnhancedNvdecDecoder = form.querySelector('#chkEnhancedNvdecDecoder').checked;
                config.EnableHardwareEncoding = form.querySelector('#chkHardwareEncoding').checked;
                config.AllowHevcEncoding = form.querySelector('#chkAllowHevcEncoding').checked;
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
            href: '#!/encodingsettings.html',
            name: globalize.translate('Transcoding')
        }, {
            href: '#!/playbackconfiguration.html',
            name: globalize.translate('ButtonResume')
        }, {
            href: '#!/streamingsettings.html',
            name: globalize.translate('TabStreaming')
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

            if (this.value == 'nvenc' || this.value == 'amf') {
                page.querySelector('.fldOpenclDevice').classList.remove('hide');
                page.querySelector('#txtOpenclDevice').setAttribute('required', 'required');
                page.querySelector('.tonemappingOptions').classList.remove('hide');
            } else if (this.value == 'vaapi') {
                page.querySelector('.fldOpenclDevice').classList.add('hide');
                page.querySelector('#txtOpenclDevice').removeAttribute('required');
                page.querySelector('.tonemappingOptions').classList.remove('hide');
            } else {
                page.querySelector('.fldOpenclDevice').classList.add('hide');
                page.querySelector('#txtOpenclDevice').removeAttribute('required');
                page.querySelector('.tonemappingOptions').classList.add('hide');
            }

            if (this.value == 'nvenc') {
                page.querySelector('.fldEnhancedNvdec').classList.remove('hide');
            } else {
                page.querySelector('.fldEnhancedNvdec').classList.add('hide');
            }

            if (systemInfo.OperatingSystem.toLowerCase() === 'linux' && (this.value == 'vaapi' || this.value == 'qsv')) {
                page.querySelector('.fldVppTonemapping').classList.remove('hide');
            } else {
                page.querySelector('.fldVppTonemapping').classList.add('hide');
            }

            if (this.value) {
                page.querySelector('.hardwareAccelerationOptions').classList.remove('hide');
            } else {
                page.querySelector('.hardwareAccelerationOptions').classList.add('hide');
            }

            setDecodingCodecsVisible(page, this.value);
        });
        $('#btnSelectEncoderPath', page).on('click.selectDirectory', function () {
            import('../../components/directorybrowser/directorybrowser').then(({default: directoryBrowser}) => {
                const picker = new directoryBrowser();
                picker.show({
                    includeFiles: true,
                    callback: function (path) {
                        if (path) {
                            $('.txtEncoderPath', page).val(path);
                        }

                        picker.close();
                    }
                });
            });
        });
        $('#btnSelectTranscodingTempPath', page).on('click.selectDirectory', function () {
            import('../../components/directorybrowser/directorybrowser').then(({default: directoryBrowser}) => {
                const picker = new directoryBrowser();
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
            import('../../components/directorybrowser/directorybrowser').then(({default: directoryBrowser}) => {
                const picker = new directoryBrowser();
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
            ApiClient.getSystemInfo().then(function (systemInfo) {
                loadPage(page, config, systemInfo);
            });
        });
    });

/* eslint-enable indent */
