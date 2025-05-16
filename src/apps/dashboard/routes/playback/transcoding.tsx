import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Stack from '@mui/material/Stack';
import Loading from 'components/loading/LoadingComponent';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import DirectoryBrowser from 'components/directorybrowser/directorybrowser';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';
import { QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import type { EncodingOptions } from '@jellyfin/sdk/lib/generated-client/models/encoding-options';
import type { DownMixStereoAlgorithms } from '@jellyfin/sdk/lib/generated-client/models/down-mix-stereo-algorithms';
import { HardwareAccelerationType } from '@jellyfin/sdk/lib/generated-client/models/hardware-acceleration-type';
import type { TonemappingAlgorithm } from '@jellyfin/sdk/lib/generated-client/models/tonemapping-algorithm';
import type { DeinterlaceMethod } from '@jellyfin/sdk/lib/generated-client/models/deinterlace-method';
import type { EncoderPreset } from '@jellyfin/sdk/lib/generated-client/models/encoder-preset';
import type { TonemappingMode } from '@jellyfin/sdk/lib/generated-client/models/tonemapping-mode';
import type { TonemappingRange } from '@jellyfin/sdk/lib/generated-client/models/tonemapping-range';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';
import { ActionData } from 'types/actionData';
import { CODECS, HEVC_REXT_DECODING_TYPES, HEVC_VP9_HW_DECODING_TYPES } from 'apps/dashboard/features/playback/constants/codecs';
import SimpleAlert from 'components/SimpleAlert';

const CONFIG_KEY = 'encoding';

// eslint-disable-next-line sonarjs/cognitive-complexity
export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const response = await getConfigurationApi(api).getNamedConfiguration({ key: CONFIG_KEY });

    const config: EncodingOptions = response.data as EncodingOptions;

    if (data.EnableAudioVbr) config.EnableAudioVbr = data.EnableAudioVbr.toString() === 'on';
    if (data.DownMixAudioBoost) config.DownMixAudioBoost = parseInt(data.DownMixAudioBoost.toString(), 10);
    if (data.DownMixStereoAlgorithm) config.DownMixStereoAlgorithm = data.DownMixStereoAlgorithm.toString() as DownMixStereoAlgorithms;
    if (data.MaxMuxingQueueSize) config.MaxMuxingQueueSize = parseInt(data.MaxMuxingQueueSize.toString(), 10);
    if (data.TranscodingTempPath) config.TranscodingTempPath = data.TranscodingTempPath.toString();
    if (data.FallbackFontPath) config.FallbackFontPath = data.FallbackFontPath.toString();
    if (data.EnableFallbackFont) config.EnableFallbackFont = data.EnableFallbackFont.toString() === 'on';
    if (data.EncodingThreadCount) config.EncodingThreadCount = parseInt(data.EncodingThreadCount.toString(), 10);
    if (data.HardwareAccelerationType) config.HardwareAccelerationType = data.HardwareAccelerationType.toString() as HardwareAccelerationType;
    if (data.VaapiDevice) config.VaapiDevice = data.VaapiDevice.toString();
    if (data.QsvDevice) config.QsvDevice = data.QsvDevice.toString();
    if (data.EnableTonemapping) config.EnableTonemapping = data.EnableTonemapping.toString() === 'on';
    if (data.EnableVppTonemapping) config.EnableVppTonemapping = data.EnableVppTonemapping.toString() === 'on';
    if (data.EnableVideoToolboxTonemapping) config.EnableVideoToolboxTonemapping = data.EnableVideoToolboxTonemapping.toString() === 'on';
    if (data.TonemappingAlgorithm) config.TonemappingAlgorithm = data.TonemappingAlgorithm.toString() as TonemappingAlgorithm;
    if (data.TonemappingMode) config.TonemappingMode = data.TonemappingMode.toString() as TonemappingMode;
    if (data.TonemappingRange) config.TonemappingRange = data.TonemappingRange.toString() as TonemappingRange;
    if (data.TonemappingDesat) config.TonemappingDesat = parseFloat(data.TonemappingDesat.toString());
    if (data.TonemappingPeak) config.TonemappingPeak = parseFloat(data.TonemappingPeak.toString());
    if (data.TonemappingParam) config.TonemappingParam = parseFloat(data.TonemappingParam.toString());
    if (data.VppTonemappingBrightness) config.VppTonemappingBrightness = parseFloat(data.VppTonemappingBrightness.toString());
    if (data.VppTonemappingContrast) config.VppTonemappingContrast = parseFloat(data.VppTonemappingContrast.toString());
    if (data.EncoderPreset) config.EncoderPreset = data.EncoderPreset.toString() as EncoderPreset;
    if (data.H264Crf) config.H264Crf = parseInt(data.H264Crf.toString() || '0', 10);
    if (data.H265Crf) config.H265Crf = parseInt(data.H265Crf.toString() || '0', 10);
    if (data.DeinterlaceMethod) config.DeinterlaceMethod = data.DeinterlaceMethod.toString() as DeinterlaceMethod;
    if (data.DeinterlaceDoubleRate) config.DeinterlaceDoubleRate = data.DeinterlaceDoubleRate.toString() === 'on';
    if (data.EnableSubtitleExtraction) config.EnableSubtitleExtraction = data.EnableSubtitleExtraction.toString() === 'on';
    if (data.EnableThrottling) config.EnableThrottling = data.EnableThrottling.toString() === 'on';
    if (data.EnableSegmentDeletion) config.EnableSegmentDeletion = data.EnableSegmentDeletion.toString() === 'on';
    if (data.ThrottleDelaySeconds) config.ThrottleDelaySeconds = parseInt(data.ThrottleDelaySeconds.toString(), 10);
    if (data.SegmentKeepSeconds) config.SegmentKeepSeconds = parseInt(data.SegmentKeepSeconds.toString(), 10);
    config.HardwareDecodingCodecs = CODECS
        .map(c => c.codec)
        .filter(c => data[c]?.toString() === 'on');
    if (data.EnableDecodingColorDepth10Hevc) config.EnableDecodingColorDepth10Hevc = data.EnableDecodingColorDepth10Hevc.toString() === 'on';
    if (data.EnableDecodingColorDepth10Vp9) config.EnableDecodingColorDepth10Vp9 = data.EnableDecodingColorDepth10Vp9.toString() === 'on';
    if (data.EnableDecodingColorDepth10HevcRext) config.EnableDecodingColorDepth10HevcRext = data.EnableDecodingColorDepth10HevcRext.toString() === 'on';
    if (data.EnableDecodingColorDepth12HevcRext) config.EnableDecodingColorDepth12HevcRext = data.EnableDecodingColorDepth12HevcRext.toString() === 'on';
    if (data.EnableEnhancedNvdecDecoder) config.EnableEnhancedNvdecDecoder = data.EnableEnhancedNvdecDecoder.toString() === 'on';
    if (data.PreferSystemNativeHwDecoder) config.PreferSystemNativeHwDecoder = data.PreferSystemNativeHwDecoder.toString() === 'on';
    if (data.EnableIntelLowPowerH264HwEncoder) config.EnableIntelLowPowerH264HwEncoder = data.EnableIntelLowPowerH264HwEncoder.toString() === 'on';
    if (data.EnableIntelLowPowerHevcHwEncoder) config.EnableIntelLowPowerHevcHwEncoder = data.EnableIntelLowPowerHevcHwEncoder.toString() === 'on';
    if (data.EnableHardwareEncoding) config.EnableHardwareEncoding = data.EnableHardwareEncoding.toString() === 'on';
    if (data.AllowHevcEncoding) config.AllowHevcEncoding = data.AllowHevcEncoding.toString() === 'on';
    if (data.AllowAv1Encoding) config.AllowAv1Encoding = data.AllowAv1Encoding.toString() === 'on';

    await getConfigurationApi(api)
        .updateNamedConfiguration({ key: CONFIG_KEY, body: config });

    void queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, CONFIG_KEY]
    });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const { data: config, isPending, isError } = useNamedConfiguration<EncodingOptions>(CONFIG_KEY);
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';
    const [ hardwareAccelType, setHardwareAccelType ] = useState<string | null>(null);
    const [ transcodingTempPath, setTranscodingTempPath ] = useState<string | null>(null);
    const [ fallbackFontPath, setFallbackFontPath ] = useState<string | null>(null);
    const [ isAlertOpen, setIsAlertOpen ] = useState(false);

    useEffect(() => {
        if (config) {
            if (!hardwareAccelType && config.HardwareAccelerationType) {
                setHardwareAccelType(config.HardwareAccelerationType);
            }

            if (transcodingTempPath == null) {
                setTranscodingTempPath(config.TranscodingTempPath || '');
            }

            if (fallbackFontPath == null) {
                setFallbackFontPath(config.FallbackFontPath || '');
            }
        }
    }, [ config, hardwareAccelType, transcodingTempPath, fallbackFontPath ]);

    const onAlertClose = useCallback(() => {
        setIsAlertOpen(false);
    }, []);

    const onSubmit = useCallback(() => {
        setIsAlertOpen(true);
    }, []);

    const onHardwareAccelTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setHardwareAccelType(e.target.value);
    }, []);

    const onTranscodingTempPathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTranscodingTempPath(e.target.value);
    }, []);

    const onFallbackFontPathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFallbackFontPath(e.target.value);
    }, []);

    const showTranscodingPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                setTranscodingTempPath(path);

                picker.close();
            },
            validateWriteable: true,
            header: globalize.translate('HeaderSelectTranscodingPath'),
            instruction: globalize.translate('HeaderSelectTranscodingPathHelp')
        });
    }, []);

    const showFallbackFontPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                setFallbackFontPath(path);

                picker.close();
            },
            header: globalize.translate('HeaderSelectFallbackFontPath'),
            instruction: globalize.translate('HeaderSelectFallbackFontPathHelp')
        });
    }, []);

    const isHwaSelected = [ 'amf', 'nvenc', 'qsv', 'vaapi', 'rkmpp', 'videotoolbox' ].includes(hardwareAccelType || 'none');

    const availableCodecs = useMemo(() => (
        CODECS.filter(codec => codec.types.includes(hardwareAccelType || ''))
    ), [hardwareAccelType]);

    if (isPending || !hardwareAccelType) return <Loading />;

    return (
        <Page
            id='encodingSettingsPage'
            className='mainAnimatedPage type-interior'
            title={globalize.translate('TitlePlayback')}
        >
            <SimpleAlert
                open={isAlertOpen}
                onClose={onAlertClose}
                title={globalize.translate('TitleHardwareAcceleration')}
                text={globalize.translate('HardwareAccelerationWarning')}
            />
            <Box className='content-primary'>
                {isError ? (
                    <Alert severity='error'>{globalize.translate('TranscodingLoadError')}</Alert>
                ) : (
                    <Form method='POST' onSubmit={onSubmit}>
                        <Stack spacing={3}>
                            <Typography variant='h1'>{globalize.translate('Transcoding')}</Typography>

                            {!isSubmitting && actionData?.isSaved && (
                                <Alert severity='success'>
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}

                            <TextField
                                name='HardwareAccelerationType'
                                select
                                label={globalize.translate('LabelHardwareAccelerationType')}
                                value={hardwareAccelType || 'none'}
                                onChange={onHardwareAccelTypeChange}
                                helperText={(
                                    <Link href='https://jellyfin.org/docs/general/administration/hardware-acceleration' target='_blank'>
                                        {globalize.translate('LabelHardwareAccelerationTypeHelp')}
                                    </Link>
                                )}
                            >
                                <MenuItem value='none'>{globalize.translate('None')}</MenuItem>
                                <MenuItem value='amf'>AMD AMF</MenuItem>
                                <MenuItem value='nvenc'>Nvidia NVENC</MenuItem>
                                <MenuItem value='qsv'>Intel Quicksync (QSV)</MenuItem>
                                <MenuItem value='vaapi'>Video Acceleration API (VAAPI)</MenuItem>
                                <MenuItem value='rkmpp'>Rockchip MPP (RKMPP)</MenuItem>
                                <MenuItem value='videotoolbox'>Apple VideoToolBox</MenuItem>
                                <MenuItem value='v4l2m2m'>Video4Linux2 (V4L2)</MenuItem>
                            </TextField>

                            {hardwareAccelType === 'vaapi' && (
                                <TextField
                                    name='VaapiDevice'
                                    label={globalize.translate('LabelVaapiDevice')}
                                    defaultValue={config.VaapiDevice}
                                    helperText={globalize.translate('LabelVaapiDeviceHelp')}
                                />
                            )}

                            {hardwareAccelType === 'qsv' && (
                                <TextField
                                    name='QsvDevice'
                                    label={globalize.translate('LabelQsvDevice')}
                                    defaultValue={config.QsvDevice}
                                    helperText={globalize.translate('LabelQsvDeviceHelp')}
                                />
                            )}

                            {hardwareAccelType !== 'none' && (
                                <>
                                    <Typography variant='h3'>{globalize.translate('LabelEnableHardwareDecodingFor')}</Typography>
                                    <FormGroup>
                                        {availableCodecs.map(codec => (
                                            <FormControlLabel
                                                key={codec.name}
                                                label={codec.name}
                                                control={
                                                    <Checkbox
                                                        name={codec.codec}
                                                        defaultChecked={(config.HardwareDecodingCodecs || []).includes(codec.codec)}
                                                    />
                                                }
                                            />
                                        ))}

                                        {HEVC_VP9_HW_DECODING_TYPES.includes(hardwareAccelType) && (
                                            <FormControlLabel
                                                label={'HEVC 10bit'}
                                                control={
                                                    <Checkbox
                                                        name={'EnableDecodingColorDepth10Hevc'}
                                                        defaultChecked={config.EnableDecodingColorDepth10Hevc}
                                                    />
                                                }
                                            />
                                        )}

                                        {HEVC_VP9_HW_DECODING_TYPES.includes(hardwareAccelType) && (
                                            <FormControlLabel
                                                label={'VP9 10bit'}
                                                control={
                                                    <Checkbox
                                                        name={'EnableDecodingColorDepth10Vp9'}
                                                        defaultChecked={config.EnableDecodingColorDepth10Vp9}
                                                    />
                                                }
                                            />
                                        )}

                                        {HEVC_REXT_DECODING_TYPES.includes(hardwareAccelType) && (
                                            <FormControlLabel
                                                label={'HEVC RExt 8/10bit'}
                                                control={
                                                    <Checkbox
                                                        name={'EnableDecodingColorDepth10HevcRext'}
                                                        defaultChecked={config.EnableDecodingColorDepth10HevcRext}
                                                    />
                                                }
                                            />
                                        )}

                                        {HEVC_REXT_DECODING_TYPES.includes(hardwareAccelType) && (
                                            <FormControlLabel
                                                label={'HEVC RExt 12bit'}
                                                control={
                                                    <Checkbox
                                                        name={'EnableDecodingColorDepth12HevcRext'}
                                                        defaultChecked={config.EnableDecodingColorDepth12HevcRext}
                                                    />
                                                }
                                            />
                                        )}
                                    </FormGroup>
                                </>
                            )}

                            {hardwareAccelType === 'nvenc' && (
                                <FormControl>
                                    <FormControlLabel
                                        label={globalize.translate('EnableEnhancedNvdecDecoder')}
                                        control={
                                            <Checkbox name='EnableEnhancedNvdecDecoder' defaultChecked={config.EnableEnhancedNvdecDecoder} />
                                        }
                                    />
                                    <FormHelperText>{globalize.translate('EnableEnhancedNvdecDecoderHelp')}</FormHelperText>
                                </FormControl>
                            )}

                            {hardwareAccelType === 'qsv' && (
                                <FormControl>
                                    <FormControlLabel
                                        label={globalize.translate('PreferSystemNativeHwDecoder')}
                                        control={
                                            <Checkbox name='PreferSystemNativeHwDecoder' defaultChecked={config.PreferSystemNativeHwDecoder} />
                                        }
                                    />
                                </FormControl>
                            )}

                            {hardwareAccelType !== 'none' && (
                                <FormControl variant='standard'>
                                    <Typography variant='h3'>{globalize.translate('LabelHardwareEncodingOptions')}</Typography>
                                    <FormGroup>
                                        <FormControlLabel
                                            label={globalize.translate('EnableHardwareEncoding')}
                                            control={
                                                <Checkbox name='EnableHardwareEncoding' defaultChecked={config.EnableHardwareEncoding} />
                                            }
                                        />
                                        {(hardwareAccelType === 'qsv' || hardwareAccelType === 'vaapi') && (
                                            <>
                                                <FormControlLabel
                                                    label={globalize.translate('EnableIntelLowPowerH264HwEncoder')}
                                                    control={
                                                        <Checkbox name='EnableIntelLowPowerH264HwEncoder' defaultChecked={config.EnableIntelLowPowerH264HwEncoder} />
                                                    }
                                                />
                                                <FormControlLabel
                                                    label={globalize.translate('EnableIntelLowPowerHevcHwEncoder')}
                                                    control={
                                                        <Checkbox name='EnableIntelLowPowerHevcHwEncoder' defaultChecked={config.EnableIntelLowPowerHevcHwEncoder} />
                                                    }
                                                />
                                                <FormHelperText>
                                                    <Link href='https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/intel#configure-and-verify-lp-mode-on-linux' target='_blank'>
                                                        {globalize.translate('IntelLowPowerEncHelp')}
                                                    </Link>
                                                </FormHelperText>
                                            </>
                                        )}
                                    </FormGroup>
                                </FormControl>
                            )}

                            <FormControl variant='standard'>
                                <Typography variant='h3'>{globalize.translate('LabelEncodingFormatOptions')}</Typography>
                                <FormHelperText>{globalize.translate('EncodingFormatHelp')}</FormHelperText>
                                <FormGroup>
                                    <FormControlLabel
                                        label={globalize.translate('AllowHevcEncoding')}
                                        control={
                                            <Checkbox name='AllowHevcEncoding' defaultChecked={config.AllowHevcEncoding} />
                                        }
                                    />
                                    <FormControlLabel
                                        label={globalize.translate('AllowAv1Encoding')}
                                        control={
                                            <Checkbox name='AllowAv1Encoding' defaultChecked={config.AllowAv1Encoding} />
                                        }
                                    />
                                </FormGroup>
                            </FormControl>

                            {(hardwareAccelType === 'qsv' || hardwareAccelType === 'vaapi') && (
                                <>
                                    <FormControl>
                                        <FormControlLabel
                                            label={globalize.translate('EnableVppTonemapping')}
                                            control={
                                                <Checkbox name='EnableVppTonemapping' defaultChecked={config.EnableVppTonemapping} />
                                            }
                                        />
                                        <FormHelperText>{globalize.translate('AllowVppTonemappingHelp')}</FormHelperText>
                                    </FormControl>

                                    <TextField
                                        name='VppTonemappingBrightness'
                                        defaultValue={config.VppTonemappingBrightness}
                                        label={globalize.translate('LabelVppTonemappingBrightness')}
                                        helperText={globalize.translate('LabelVppTonemappingBrightnessHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                max: 100,
                                                step: 0.00001
                                            }
                                        }}
                                    />

                                    <TextField
                                        name='VppTonemappingContrast'
                                        defaultValue={config.VppTonemappingContrast}
                                        label={globalize.translate('LabelVppTonemappingContrast')}
                                        helperText={globalize.translate('LabelVppTonemappingContrastHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 1,
                                                max: 2,
                                                step: 0.00001
                                            }
                                        }}
                                    />
                                </>
                            )}

                            {hardwareAccelType === 'videotoolbox' && (
                                <FormControl>
                                    <FormControlLabel
                                        label={globalize.translate('EnableVideoToolboxTonemapping')}
                                        control={
                                            <Checkbox name='EnableVideoToolboxTonemapping' defaultChecked={config.EnableVideoToolboxTonemapping} />
                                        }
                                    />
                                    <FormHelperText>{globalize.translate('AllowVideoToolboxTonemappingHelp')}</FormHelperText>
                                </FormControl>
                            )}

                            {(hardwareAccelType === 'none' || isHwaSelected) && (
                                <>
                                    <FormControl>
                                        <FormControlLabel
                                            label={globalize.translate('EnableTonemapping')}
                                            control={
                                                <Checkbox name='EnableTonemapping' defaultChecked={config.EnableTonemapping} />
                                            }
                                        />
                                        <FormHelperText>{globalize.translate(isHwaSelected ? 'AllowTonemappingHelp' : 'AllowTonemappingSoftwareHelp')}</FormHelperText>
                                    </FormControl>

                                    <TextField
                                        name='TonemappingAlgorithm'
                                        select
                                        label={globalize.translate('LabelTonemappingAlgorithm')}
                                        defaultValue={config.TonemappingAlgorithm}
                                        helperText={(
                                            <Link href='https://ffmpeg.org/ffmpeg-all.html#tonemap_005fopencl' target='_blank'>
                                                {globalize.translate('TonemappingAlgorithmHelp')}
                                            </Link>
                                        )}
                                    >
                                        <MenuItem value='none'>{globalize.translate('None')}</MenuItem>
                                        <MenuItem value='clip'>Clip</MenuItem>
                                        <MenuItem value='linear'>Linear</MenuItem>
                                        <MenuItem value='gamma'>Gamma</MenuItem>
                                        <MenuItem value='reinhard'>Reinhard</MenuItem>
                                        <MenuItem value='hable'>Hable</MenuItem>
                                        <MenuItem value='mobius'>Mobius</MenuItem>
                                        <MenuItem value='bt2390'>BT.2390</MenuItem>
                                    </TextField>

                                    {isHwaSelected && (
                                        <TextField
                                            name='TonemappingMode'
                                            select
                                            defaultValue={config.TonemappingMode}
                                            label={globalize.translate('LabelTonemappingMode')}
                                            helperText={globalize.translate('TonemappingModeHelp')}
                                        >
                                            <MenuItem value='auto'>{globalize.translate('Auto')}</MenuItem>
                                            <MenuItem value='max'>MAX</MenuItem>
                                            <MenuItem value='rgb'>RGB</MenuItem>
                                            <MenuItem value='lum'>LUM</MenuItem>
                                            <MenuItem value='itp'>ITP</MenuItem>
                                        </TextField>
                                    )}

                                    <TextField
                                        name='TonemappingRange'
                                        select
                                        defaultValue={config.TonemappingRange}
                                        label={globalize.translate('LabelTonemappingRange')}
                                        helperText={globalize.translate('TonemappingRangeHelp')}
                                    >
                                        <MenuItem value='auto'>{globalize.translate('Auto')}</MenuItem>
                                        <MenuItem value='tv'>TV</MenuItem>
                                        <MenuItem value='pc'>PC</MenuItem>
                                    </TextField>

                                    <TextField
                                        name='TonemappingDesat'
                                        defaultValue={config.TonemappingDesat}
                                        label={globalize.translate('LabelTonemappingDesat')}
                                        helperText={globalize.translate('LabelTonemappingDesatHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                max: 1.79769e+308,
                                                step: 0.00001
                                            }
                                        }}
                                    />

                                    <TextField
                                        name='TonemappingPeak'
                                        defaultValue={config.TonemappingPeak}
                                        label={globalize.translate('LabelTonemappingPeak')}
                                        helperText={globalize.translate('LabelTonemappingPeakHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                max: 1.79769e+308,
                                                step: 0.00001
                                            }
                                        }}
                                    />

                                    <TextField
                                        name='TonemappingParam'
                                        defaultValue={config.TonemappingParam || ''}
                                        label={globalize.translate('LabelTonemappingParam')}
                                        helperText={globalize.translate('LabelTonemappingParamHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 2.22507e-308,
                                                max: 1.79769e+308,
                                                step: 0.00001
                                            }
                                        }}
                                    />
                                </>
                            )}

                            <TextField
                                name='EncodingThreadCount'
                                defaultValue={config.EncodingThreadCount}
                                label={globalize.translate('LabelTranscodingThreadCount')}
                                helperText={globalize.translate('LabelTranscodingThreadCountHelp')}
                                select
                            >
                                <MenuItem value='-1'>{globalize.translate('Auto')}</MenuItem>
                                <MenuItem value='1'>1</MenuItem>
                                <MenuItem value='2'>2</MenuItem>
                                <MenuItem value='3'>3</MenuItem>
                                <MenuItem value='4'>4</MenuItem>
                                <MenuItem value='5'>5</MenuItem>
                                <MenuItem value='6'>6</MenuItem>
                                <MenuItem value='7'>7</MenuItem>
                                <MenuItem value='8'>8</MenuItem>
                                <MenuItem value='9'>9</MenuItem>
                                <MenuItem value='10'>10</MenuItem>
                                <MenuItem value='11'>11</MenuItem>
                                <MenuItem value='12'>12</MenuItem>
                                <MenuItem value='13'>13</MenuItem>
                                <MenuItem value='14'>14</MenuItem>
                                <MenuItem value='15'>15</MenuItem>
                                <MenuItem value='16'>16</MenuItem>
                                <MenuItem value='0'>{globalize.translate('OptionMax')}</MenuItem>
                            </TextField>

                            <TextField
                                name='FFmpegPath'
                                defaultValue={config.EncoderAppPathDisplay}
                                label={globalize.translate('LabelffmpegPath')}
                                helperText={globalize.translate('LabelffmpegPathHelp')}
                                disabled
                            />

                            <TextField
                                name='TranscodingTempPath'
                                value={transcodingTempPath}
                                onChange={onTranscodingTempPathChange}
                                label={globalize.translate('LabelTranscodePath')}
                                helperText={globalize.translate('LabelTranscodingTempPathHelp')}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <IconButton edge='end' onClick={showTranscodingPathPicker}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <TextField
                                name='FallbackFontPath'
                                value={fallbackFontPath}
                                onChange={onFallbackFontPathChange}
                                label={globalize.translate('LabelFallbackFontPath')}
                                helperText={
                                    <Link href='https://jellyfin.org/docs/general/administration/configuration#fonts' target='_blank'>
                                        {globalize.translate('LabelFallbackFontPathHelp')}
                                    </Link>
                                }
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <IconButton edge='end' onClick={showFallbackFontPathPicker}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('EnableFallbackFont')}
                                    control={
                                        <Checkbox name='EnableFallbackFont'
                                            defaultChecked={config.EnableFallbackFont} />
                                    }
                                />
                                <FormHelperText>{globalize.translate('EnableFallbackFontHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('LabelEnableAudioVbr')}
                                    control={
                                        <Checkbox name='EnableAudioVbr'
                                            defaultChecked={config.EnableAudioVbr} />
                                    }
                                />
                                <FormHelperText>{globalize.translate('LabelEnableAudioVbrHelp')}</FormHelperText>
                            </FormControl>

                            <TextField
                                name='DownMixAudioBoost'
                                defaultValue={config.DownMixAudioBoost}
                                label={globalize.translate('LabelDownMixAudioScale')}
                                helperText={globalize.translate('LabelDownMixAudioScaleHelp')}
                                type='number'
                                slotProps={{
                                    htmlInput: {
                                        required: true,
                                        min: 0.5,
                                        max: 3,
                                        step: 0.1
                                    }
                                }}
                            />

                            <TextField
                                name='DownMixStereoAlgorithm'
                                defaultValue={config.DownMixStereoAlgorithm}
                                label={globalize.translate('LabelStereoDownmixAlgorithm')}
                                helperText={globalize.translate('StereoDownmixAlgorithmHelp')}
                                select
                            >
                                <MenuItem value='None'>{globalize.translate('None')}</MenuItem>
                                <MenuItem value='Dave750'>Dave750</MenuItem>
                                <MenuItem value='NightmodeDialogue'>NightmodeDialogue</MenuItem>
                                <MenuItem value='Rfc7845'>RFC7845</MenuItem>
                                <MenuItem value='Ac4'>AC-4</MenuItem>
                            </TextField>

                            <TextField
                                name='MaxMuxingQueueSize'
                                defaultValue={config.MaxMuxingQueueSize}
                                label={globalize.translate('LabelMaxMuxingQueueSize')}
                                helperText={globalize.translate('LabelMaxMuxingQueueSizeHelp')}
                            />

                            <TextField
                                name='EncoderPreset'
                                defaultValue={config.EncoderPreset}
                                label={globalize.translate('LabelEncoderPreset')}
                                helperText={globalize.translate('EncoderPresetHelp')}
                                select
                            >
                                <MenuItem value='auto'>{globalize.translate('Auto')}</MenuItem>
                                <MenuItem value='veryslow'>veryslow</MenuItem>
                                <MenuItem value='slower'>slower</MenuItem>
                                <MenuItem value='slow'>slow</MenuItem>
                                <MenuItem value='medium'>medium</MenuItem>
                                <MenuItem value='fast'>fast</MenuItem>
                                <MenuItem value='faster'>faster</MenuItem>
                                <MenuItem value='veryfast'>veryfast</MenuItem>
                                <MenuItem value='superfast'>superfast</MenuItem>
                                <MenuItem value='ultrafast'>ultrafast</MenuItem>
                            </TextField>

                            <TextField
                                name='H265Crf'
                                defaultValue={config.H265Crf}
                                label={globalize.translate('LabelH265Crf')}
                                type='number'
                                slotProps={{
                                    htmlInput: {
                                        min: 0,
                                        max: 51,
                                        step: 1
                                    }
                                }}
                            />

                            <TextField
                                name='H264Crf'
                                defaultValue={config.H264Crf}
                                label={globalize.translate('LabelH264Crf')}
                                helperText={globalize.translate('H264CrfHelp')}
                                type='number'
                                slotProps={{
                                    htmlInput: {
                                        min: 0,
                                        max: 51,
                                        step: 1
                                    }
                                }}
                            />

                            <TextField
                                name='DeinterlaceMethod'
                                defaultValue={config.DeinterlaceMethod}
                                label={globalize.translate('LabelDeinterlaceMethod')}
                                helperText={globalize.translate('DeinterlaceMethodHelp')}
                                select
                            >
                                <MenuItem value='yadif'>{globalize.translate('Yadif')}</MenuItem>
                                <MenuItem value='bwdif'>{globalize.translate('Bwdif')}</MenuItem>
                            </TextField>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('UseDoubleRateDeinterlacing')}
                                    control={
                                        <Checkbox name='DeinterlaceDoubleRate'
                                            defaultChecked={config.DeinterlaceDoubleRate} />
                                    }
                                />
                                <FormHelperText>{globalize.translate('UseDoubleRateDeinterlacingHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowOnTheFlySubtitleExtraction')}
                                    control={
                                        <Checkbox name='EnableSubtitleExtraction'
                                            defaultChecked={config.EnableSubtitleExtraction} />
                                    }
                                />
                                <FormHelperText>{globalize.translate('AllowOnTheFlySubtitleExtractionHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowFfmpegThrottling')}
                                    control={
                                        <Checkbox name='EnableThrottling'
                                            defaultChecked={config.EnableThrottling} />
                                    }
                                />
                                <FormHelperText>{globalize.translate('AllowFfmpegThrottlingHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowSegmentDeletion')}
                                    control={
                                        <Checkbox name='EnableSegmentDeletion'
                                            defaultChecked={config.EnableSegmentDeletion} />
                                    }
                                />
                                <FormHelperText>{globalize.translate('AllowSegmentDeletionHelp')}</FormHelperText>
                            </FormControl>

                            <TextField
                                name='ThrottleDelaySeconds'
                                defaultValue={config.ThrottleDelaySeconds}
                                label={globalize.translate('LabelThrottleDelaySeconds')}
                                helperText={globalize.translate('LabelThrottleDelaySecondsHelp')}
                                type='number'
                                slotProps={{
                                    htmlInput: {
                                        min: 10,
                                        max: 3600,
                                        step: 1
                                    }
                                }}
                            />

                            <TextField
                                name='SegmentKeepSeconds'
                                defaultValue={config.SegmentKeepSeconds}
                                label={globalize.translate('LabelSegmentKeepSeconds')}
                                helperText={globalize.translate('LabelSegmentKeepSecondsHelp')}
                                type='number'
                                slotProps={{
                                    htmlInput: {
                                        min: 10,
                                        max: 3600,
                                        step: 1
                                    }
                                }}
                            />

                            <Button type='submit' size='large'>
                                {globalize.translate('Save')}
                            </Button>
                        </Stack>
                    </Form>
                )}
            </Box>
        </Page>
    );
};
