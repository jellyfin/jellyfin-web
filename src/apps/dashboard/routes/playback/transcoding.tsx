import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { type ActionFunctionArgs, Form, useActionData, useNavigation, useSubmit } from 'react-router-dom';
import { QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import type { EncodingOptions } from '@jellyfin/sdk/lib/generated-client/models/encoding-options';
import { HardwareAccelerationType } from '@jellyfin/sdk/lib/generated-client/models/hardware-acceleration-type';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';
import { ActionData } from 'types/actionData';
import { CODECS, HEVC_REXT_DECODING_TYPES, HEVC_VP9_HW_DECODING_TYPES } from 'apps/dashboard/features/playback/constants/codecs';
import SimpleAlert from 'components/SimpleAlert';

const CONFIG_KEY = 'encoding';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const data = await request.json() as EncodingOptions;

    await getConfigurationApi(api)
        .updateNamedConfiguration({ key: CONFIG_KEY, body: data });

    void queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, CONFIG_KEY]
    });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const { data: initialConfig, isPending, isError } = useNamedConfiguration<EncodingOptions>(CONFIG_KEY);
    const [ config, setConfig ] = useState<EncodingOptions | null>(null);
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const submit = useSubmit();
    const isSubmitting = navigation.state === 'submitting';
    const [ isAlertOpen, setIsAlertOpen ] = useState(false);

    useEffect(() => {
        if (initialConfig && config == null) {
            setConfig(initialConfig);
        }
    }, [ initialConfig, config ]);

    const onConfigChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.value
        });
    }, [ config ]);

    const onCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.checked
        });
    }, [ config ]);

    const onCodecChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (config?.HardwareDecodingCodecs) {
            if (e.target.checked) {
                setConfig({
                    ...config,
                    HardwareDecodingCodecs: [
                        ...config.HardwareDecodingCodecs,
                        e.target.name
                    ]
                });
            } else {
                setConfig({
                    ...config,
                    HardwareDecodingCodecs: config.HardwareDecodingCodecs.filter(v => v !== e.target.name)
                });
            }
        }
    }, [ config ]);

    const onAlertClose = useCallback(() => {
        setIsAlertOpen(false);
    }, []);

    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (config) {
            setIsAlertOpen(true);
            submit(
                { ...config },
                { method: 'post', encType: 'application/json' }
            );
        }
    }, [ config, submit ]);

    const showTranscodingPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                setConfig({
                    ...config,
                    TranscodingTempPath: path
                });

                picker.close();
            },
            validateWriteable: true,
            header: globalize.translate('HeaderSelectTranscodingPath'),
            instruction: globalize.translate('HeaderSelectTranscodingPathHelp')
        });
    }, [ config ]);

    const showFallbackFontPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: (path: string) => {
                setConfig({
                    ...config,
                    FallbackFontPath: path
                });

                picker.close();
            },
            header: globalize.translate('HeaderSelectFallbackFontPath'),
            instruction: globalize.translate('HeaderSelectFallbackFontPathHelp')
        });
    }, [ config ]);

    const hardwareAccelType = config?.HardwareAccelerationType || HardwareAccelerationType.None;
    const isHwaSelected = [ 'amf', 'nvenc', 'qsv', 'vaapi', 'rkmpp', 'videotoolbox' ].includes(hardwareAccelType);

    const availableCodecs = useMemo(() => (
        CODECS.filter(codec => codec.types.includes(hardwareAccelType))
    ), [hardwareAccelType]);

    if (isPending || !config) return <Loading />;

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
                                value={config.HardwareAccelerationType}
                                onChange={onConfigChange}
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
                                    value={config.VaapiDevice}
                                    onChange={onConfigChange}
                                    helperText={globalize.translate('LabelVaapiDeviceHelp')}
                                />
                            )}

                            {hardwareAccelType === 'qsv' && (
                                <TextField
                                    name='QsvDevice'
                                    label={globalize.translate('LabelQsvDevice')}
                                    value={config.QsvDevice}
                                    onChange={onConfigChange}
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
                                                        checked={(config.HardwareDecodingCodecs || []).includes(codec.codec)}
                                                        onChange={onCodecChange}
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
                                                        checked={config.EnableDecodingColorDepth10Hevc}
                                                        onChange={onCheckboxChange}
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
                                                        checked={config.EnableDecodingColorDepth10Vp9}
                                                        onChange={onCheckboxChange}
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
                                                        checked={config.EnableDecodingColorDepth10HevcRext}
                                                        onChange={onCheckboxChange}
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
                                                        checked={config.EnableDecodingColorDepth12HevcRext}
                                                        onChange={onCheckboxChange}
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
                                            <Checkbox
                                                name='EnableEnhancedNvdecDecoder'
                                                checked={config.EnableEnhancedNvdecDecoder}
                                                onChange={onCheckboxChange}
                                            />
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
                                            <Checkbox
                                                name='PreferSystemNativeHwDecoder'
                                                checked={config.PreferSystemNativeHwDecoder}
                                                onChange={onCheckboxChange}
                                            />
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
                                                <Checkbox
                                                    name='EnableHardwareEncoding'
                                                    checked={config.EnableHardwareEncoding}
                                                    onChange={onCheckboxChange}
                                                />
                                            }
                                        />
                                        {(hardwareAccelType === 'qsv' || hardwareAccelType === 'vaapi') && (
                                            <>
                                                <FormControlLabel
                                                    label={globalize.translate('EnableIntelLowPowerH264HwEncoder')}
                                                    control={
                                                        <Checkbox
                                                            name='EnableIntelLowPowerH264HwEncoder'
                                                            checked={config.EnableIntelLowPowerH264HwEncoder}
                                                            onChange={onCheckboxChange}
                                                        />
                                                    }
                                                />
                                                <FormControlLabel
                                                    label={globalize.translate('EnableIntelLowPowerHevcHwEncoder')}
                                                    control={
                                                        <Checkbox
                                                            name='EnableIntelLowPowerHevcHwEncoder'
                                                            checked={config.EnableIntelLowPowerHevcHwEncoder}
                                                            onChange={onCheckboxChange}
                                                        />
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
                                            <Checkbox
                                                name='AllowHevcEncoding'
                                                checked={config.AllowHevcEncoding}
                                                onChange={onCheckboxChange}
                                            />
                                        }
                                    />
                                    <FormControlLabel
                                        label={globalize.translate('AllowAv1Encoding')}
                                        control={
                                            <Checkbox
                                                name='AllowAv1Encoding'
                                                checked={config.AllowAv1Encoding}
                                                onChange={onCheckboxChange}
                                            />
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
                                                <Checkbox
                                                    name='EnableVppTonemapping'
                                                    checked={config.EnableVppTonemapping}
                                                    onChange={onCheckboxChange}
                                                />
                                            }
                                        />
                                        <FormHelperText>{globalize.translate('AllowVppTonemappingHelp')}</FormHelperText>
                                    </FormControl>

                                    <TextField
                                        name='VppTonemappingBrightness'
                                        value={config.VppTonemappingBrightness}
                                        onChange={onConfigChange}
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
                                        value={config.VppTonemappingContrast}
                                        onChange={onConfigChange}
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
                                            <Checkbox
                                                name='EnableVideoToolboxTonemapping'
                                                checked={config.EnableVideoToolboxTonemapping}
                                                onChange={onCheckboxChange}
                                            />
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
                                                <Checkbox
                                                    name='EnableTonemapping'
                                                    checked={config.EnableTonemapping}
                                                    onChange={onCheckboxChange}
                                                />
                                            }
                                        />
                                        <FormHelperText>{globalize.translate(isHwaSelected ? 'AllowTonemappingHelp' : 'AllowTonemappingSoftwareHelp')}</FormHelperText>
                                    </FormControl>

                                    <TextField
                                        name='TonemappingAlgorithm'
                                        select
                                        label={globalize.translate('LabelTonemappingAlgorithm')}
                                        value={config.TonemappingAlgorithm}
                                        onChange={onConfigChange}
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
                                            value={config.TonemappingMode}
                                            onChange={onConfigChange}
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
                                        value={config.TonemappingRange}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelTonemappingRange')}
                                        helperText={globalize.translate('TonemappingRangeHelp')}
                                    >
                                        <MenuItem value='auto'>{globalize.translate('Auto')}</MenuItem>
                                        <MenuItem value='tv'>TV</MenuItem>
                                        <MenuItem value='pc'>PC</MenuItem>
                                    </TextField>

                                    <TextField
                                        name='TonemappingDesat'
                                        value={config.TonemappingDesat}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelTonemappingDesat')}
                                        helperText={globalize.translate('LabelTonemappingDesatHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                step: 0.00001
                                            }
                                        }}
                                    />

                                    <TextField
                                        name='TonemappingPeak'
                                        value={config.TonemappingPeak}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelTonemappingPeak')}
                                        helperText={globalize.translate('LabelTonemappingPeakHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                step: 0.00001
                                            }
                                        }}
                                    />

                                    <TextField
                                        name='TonemappingParam'
                                        value={config.TonemappingParam || ''}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelTonemappingParam')}
                                        helperText={globalize.translate('LabelTonemappingParamHelp')}
                                        type='number'
                                        slotProps={{
                                            htmlInput: {
                                                min: 0,
                                                step: 0.00001
                                            }
                                        }}
                                    />
                                </>
                            )}

                            <TextField
                                name='EncodingThreadCount'
                                value={config.EncodingThreadCount}
                                onChange={onConfigChange}
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
                                value={config.EncoderAppPathDisplay}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelffmpegPath')}
                                helperText={globalize.translate('LabelffmpegPathHelp')}
                                disabled
                            />

                            <TextField
                                name='TranscodingTempPath'
                                value={config.TranscodingTempPath}
                                onChange={onConfigChange}
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
                                value={config.FallbackFontPath}
                                onChange={onConfigChange}
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
                                        <Checkbox
                                            name='EnableFallbackFont'
                                            checked={config.EnableFallbackFont}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>{globalize.translate('EnableFallbackFontHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('LabelEnableAudioVbr')}
                                    control={
                                        <Checkbox
                                            name='EnableAudioVbr'
                                            checked={config.EnableAudioVbr}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>{globalize.translate('LabelEnableAudioVbrHelp')}</FormHelperText>
                            </FormControl>

                            <TextField
                                name='DownMixAudioBoost'
                                value={config.DownMixAudioBoost}
                                onChange={onConfigChange}
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
                                value={config.DownMixStereoAlgorithm}
                                onChange={onConfigChange}
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
                                value={config.MaxMuxingQueueSize}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelMaxMuxingQueueSize')}
                                helperText={globalize.translate('LabelMaxMuxingQueueSizeHelp')}
                            />

                            <TextField
                                name='EncoderPreset'
                                value={config.EncoderPreset}
                                onChange={onConfigChange}
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
                                value={config.H265Crf}
                                onChange={onConfigChange}
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
                                value={config.H264Crf}
                                onChange={onConfigChange}
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
                                value={config.DeinterlaceMethod}
                                onChange={onConfigChange}
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
                                        <Checkbox
                                            name='DeinterlaceDoubleRate'
                                            checked={config.DeinterlaceDoubleRate}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>{globalize.translate('UseDoubleRateDeinterlacingHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowOnTheFlySubtitleExtraction')}
                                    control={
                                        <Checkbox
                                            name='EnableSubtitleExtraction'
                                            checked={config.EnableSubtitleExtraction}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>{globalize.translate('AllowOnTheFlySubtitleExtractionHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowFfmpegThrottling')}
                                    control={
                                        <Checkbox
                                            name='EnableThrottling'
                                            checked={config.EnableThrottling}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>{globalize.translate('AllowFfmpegThrottlingHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowSegmentDeletion')}
                                    control={
                                        <Checkbox
                                            name='EnableSegmentDeletion'
                                            checked={config.EnableSegmentDeletion}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>{globalize.translate('AllowSegmentDeletionHelp')}</FormHelperText>
                            </FormControl>

                            <TextField
                                name='ThrottleDelaySeconds'
                                value={config.ThrottleDelaySeconds}
                                onChange={onConfigChange}
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
                                value={config.SegmentKeepSeconds}
                                onChange={onConfigChange}
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

Component.displayName = 'TranscodingPage';
