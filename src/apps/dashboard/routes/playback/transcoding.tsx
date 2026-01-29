import type { EncodingOptions } from '@jellyfin/sdk/lib/generated-client/models/encoding-options';
import { HardwareAccelerationType } from '@jellyfin/sdk/lib/generated-client/models/hardware-acceleration-type';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import {
    CODECS,
    HEVC_REXT_DECODING_TYPES,
    HEVC_VP9_HW_DECODING_TYPES
} from 'apps/dashboard/features/playback/constants/codecs';
import DirectoryBrowser from 'components/directorybrowser/directorybrowser';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import SimpleAlert from 'components/SimpleAlert';
import { QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { type ActionData } from 'types/actionData';
import {
    Alert,
    Button,
    Checkbox,
    Flex,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Text
} from 'ui-primitives';
import { queryClient } from 'utils/query/queryClient';

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

const CONFIG_KEY = 'encoding';

export const Component = (): React.ReactElement => {
    const {
        data: initialConfig,
        isPending,
        isError
    } = useNamedConfiguration<EncodingOptions>(CONFIG_KEY);
    const [config, setConfig] = useState<EncodingOptions | null>(null);
    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    useEffect(() => {
        if (initialConfig && config == null) {
            setConfig(initialConfig);
        }
    }, [initialConfig, config]);

    const onConfigChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            setConfig({
                ...config,
                [e.target.name]: e.target.value
            });
        },
        [config]
    );

    const onCheckboxChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setConfig({
                ...config,
                [e.target.name]: e.target.checked
            });
        },
        [config]
    );

    const onCodecChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (config?.HardwareDecodingCodecs) {
                if (e.target.checked) {
                    setConfig({
                        ...config,
                        HardwareDecodingCodecs: [...config.HardwareDecodingCodecs, e.target.name]
                    });
                } else {
                    setConfig({
                        ...config,
                        HardwareDecodingCodecs: config.HardwareDecodingCodecs.filter(
                            (v) => v !== e.target.name
                        )
                    });
                }
            }
        },
        [config]
    );

    const onAlertClose = useCallback(() => {
        setIsAlertOpen(false);
    }, []);

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!config) {
                return;
            }

            setIsAlertOpen(true);
            setIsSubmitting(true);
            try {
                const api = ServerConnections.getCurrentApi();
                if (!api) {
                    throw new Error('No Api instance available');
                }

                await getConfigurationApi(api).updateNamedConfiguration({
                    key: CONFIG_KEY,
                    body: config
                });

                void queryClient.invalidateQueries({
                    queryKey: [QUERY_KEY, CONFIG_KEY]
                });

                setActionData({ isSaved: true });
            } catch (error) {
                setActionData({ isSaved: false });
            } finally {
                setIsSubmitting(false);
            }
        },
        [config]
    );

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
    }, [config]);

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
    }, [config]);

    const hardwareAccelType = config?.HardwareAccelerationType || HardwareAccelerationType.None;
    const isHwaSelected = ['amf', 'nvenc', 'qsv', 'vaapi', 'rkmpp', 'videotoolbox'].includes(
        hardwareAccelType
    );

    const availableCodecs = useMemo(
        () => CODECS.filter((codec) => codec.types.includes(hardwareAccelType)),
        [hardwareAccelType]
    );

    if (isPending || !config) return <Loading />;

    return (
        <Page
            id="encodingSettingsPage"
            className="mainAnimatedPage type-interior"
            title={globalize.translate('TitlePlayback')}
        >
            <SimpleAlert
                open={isAlertOpen}
                onClose={onAlertClose}
                title={globalize.translate('TitleHardwareAcceleration')}
                text={globalize.translate('HardwareAccelerationWarning')}
            />
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                {isError ? (
                    <Alert variant="error">{globalize.translate('TranscodingLoadError')}</Alert>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                            <Text as="h1" size="xl" weight="bold">
                                {globalize.translate('Transcoding')}
                            </Text>

                            {!isSubmitting && actionData?.isSaved && (
                                <Alert variant="success">
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}

                            <Select
                                name="HardwareAccelerationType"
                                value={config.HardwareAccelerationType || 'none'}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue
                                        placeholder={globalize.translate(
                                            'LabelHardwareAccelerationType'
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        {globalize.translate('None')}
                                    </SelectItem>
                                    <SelectItem value="amf">AMD AMF</SelectItem>
                                    <SelectItem value="nvenc">Nvidia NVENC</SelectItem>
                                    <SelectItem value="qsv">Intel Quicksync (QSV)</SelectItem>
                                    <SelectItem value="vaapi">
                                        Video Acceleration API (VAAPI)
                                    </SelectItem>
                                    <SelectItem value="rkmpp">Rockchip MPP (RKMPP)</SelectItem>
                                    <SelectItem value="videotoolbox">Apple VideoToolBox</SelectItem>
                                    <SelectItem value="v4l2m2m">Video4Linux2 (V4L2)</SelectItem>
                                </SelectContent>
                            </Select>

                            {hardwareAccelType === 'vaapi' && (
                                <Input
                                    name="VaapiDevice"
                                    label={globalize.translate('LabelVaapiDevice')}
                                    value={config.VaapiDevice || ''}
                                    onChange={onConfigChange}
                                />
                            )}

                            {hardwareAccelType === 'qsv' && (
                                <Input
                                    name="QsvDevice"
                                    label={globalize.translate('LabelQsvDevice')}
                                    value={config.QsvDevice || ''}
                                    onChange={onConfigChange}
                                />
                            )}

                            {hardwareAccelType === 'qsv' && (
                                <Input
                                    name="QsvDevice"
                                    label={globalize.translate('LabelQsvDevice')}
                                    value={config.QsvDevice ?? ''}
                                    onChange={onConfigChange}
                                />
                            )}

                            {hardwareAccelType !== 'none' && (
                                <>
                                    <Text as="h3" size="lg" weight="bold">
                                        {globalize.translate('LabelEnableHardwareDecodingFor')}
                                    </Text>
                                    <Flex
                                        style={{ flexDirection: 'column', gap: vars.spacing['2'] }}
                                    >
                                        {availableCodecs.map((codec) => (
                                            <FormControlLabel
                                                key={codec.name}
                                                label={codec.name}
                                                control={
                                                    <Checkbox
                                                        name={codec.codec}
                                                        checked={(
                                                            config.HardwareDecodingCodecs || []
                                                        ).includes(codec.codec)}
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
                                                        checked={
                                                            config.EnableDecodingColorDepth10Hevc
                                                        }
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
                                                        checked={
                                                            config.EnableDecodingColorDepth10Vp9
                                                        }
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
                                                        checked={
                                                            config.EnableDecodingColorDepth10HevcRext
                                                        }
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
                                                        checked={
                                                            config.EnableDecodingColorDepth12HevcRext
                                                        }
                                                        onChange={onCheckboxChange}
                                                    />
                                                }
                                            />
                                        )}
                                    </Flex>
                                </>
                            )}

                            {hardwareAccelType === 'nvenc' && (
                                <FormControl>
                                    <FormControlLabel
                                        label={globalize.translate('EnableEnhancedNvdecDecoder')}
                                        control={
                                            <Checkbox
                                                name="EnableEnhancedNvdecDecoder"
                                                checked={config.EnableEnhancedNvdecDecoder}
                                                onChange={onCheckboxChange}
                                            />
                                        }
                                    />
                                    <FormHelperText>
                                        {globalize.translate('EnableEnhancedNvdecDecoderHelp')}
                                    </FormHelperText>
                                </FormControl>
                            )}

                            {hardwareAccelType === 'qsv' && (
                                <FormControl>
                                    <FormControlLabel
                                        label={globalize.translate('PreferSystemNativeHwDecoder')}
                                        control={
                                            <Checkbox
                                                name="PreferSystemNativeHwDecoder"
                                                checked={config.PreferSystemNativeHwDecoder}
                                                onChange={onCheckboxChange}
                                            />
                                        }
                                    />
                                </FormControl>
                            )}

                            {hardwareAccelType !== 'none' && (
                                <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'] }}>
                                    <Text as="h3" size="lg" weight="bold">
                                        {globalize.translate('LabelHardwareEncodingOptions')}
                                    </Text>
                                    <FormControlLabel
                                        label={globalize.translate('EnableHardwareEncoding')}
                                        control={
                                            <Checkbox
                                                name="EnableHardwareEncoding"
                                                checked={config.EnableHardwareEncoding}
                                                onChange={onCheckboxChange}
                                            />
                                        }
                                    />
                                    {(hardwareAccelType === 'qsv' ||
                                        hardwareAccelType === 'vaapi') && (
                                        <>
                                            <FormControlLabel
                                                label={globalize.translate(
                                                    'EnableIntelLowPowerH264HwEncoder'
                                                )}
                                                control={
                                                    <Checkbox
                                                        name="EnableIntelLowPowerH264HwEncoder"
                                                        checked={
                                                            config.EnableIntelLowPowerH264HwEncoder
                                                        }
                                                        onChange={onCheckboxChange}
                                                    />
                                                }
                                            />
                                            <FormControlLabel
                                                label={globalize.translate(
                                                    'EnableIntelLowPowerHevcHwEncoder'
                                                )}
                                                control={
                                                    <Checkbox
                                                        name="EnableIntelLowPowerHevcHwEncoder"
                                                        checked={
                                                            config.EnableIntelLowPowerHevcHwEncoder
                                                        }
                                                        onChange={onCheckboxChange}
                                                    />
                                                }
                                            />
                                        </>
                                    )}
                                </Flex>
                            )}

                            <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'] }}>
                                <Text as="h3" size="lg" weight="bold">
                                    {globalize.translate('LabelEncodingFormatOptions')}
                                </Text>
                                <FormControlLabel
                                    label={globalize.translate('AllowHevcEncoding')}
                                    control={
                                        <Checkbox
                                            name="AllowHevcEncoding"
                                            checked={config.AllowHevcEncoding}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormControlLabel
                                    label={globalize.translate('AllowAv1Encoding')}
                                    control={
                                        <Checkbox
                                            name="AllowAv1Encoding"
                                            checked={config.AllowAv1Encoding}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                            </Flex>

                            {(hardwareAccelType === 'qsv' || hardwareAccelType === 'vaapi') && (
                                <>
                                    <FormControl>
                                        <FormControlLabel
                                            label={globalize.translate('EnableVppTonemapping')}
                                            control={
                                                <Checkbox
                                                    name="EnableVppTonemapping"
                                                    checked={config.EnableVppTonemapping}
                                                    onChange={onCheckboxChange}
                                                />
                                            }
                                        />
                                        <FormHelperText>
                                            {globalize.translate('AllowVppTonemappingHelp')}
                                        </FormHelperText>
                                    </FormControl>

                                    <Input
                                        name="VppTonemappingBrightness"
                                        type="number"
                                        value={config.VppTonemappingBrightness}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelVppTonemappingBrightness')}
                                        min={0}
                                        max={100}
                                        step={0.00001}
                                    />

                                    <Input
                                        name="VppTonemappingContrast"
                                        type="number"
                                        value={config.VppTonemappingContrast}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelVppTonemappingContrast')}
                                        min={1}
                                        max={2}
                                        step={0.00001}
                                    />
                                </>
                            )}

                            {hardwareAccelType === 'videotoolbox' && (
                                <FormControl>
                                    <FormControlLabel
                                        label={globalize.translate('EnableVideoToolboxTonemapping')}
                                        control={
                                            <Checkbox
                                                name="EnableVideoToolboxTonemapping"
                                                checked={config.EnableVideoToolboxTonemapping}
                                                onChange={onCheckboxChange}
                                            />
                                        }
                                    />
                                    <FormHelperText>
                                        {globalize.translate('AllowVideoToolboxTonemappingHelp')}
                                    </FormHelperText>
                                </FormControl>
                            )}

                            {(hardwareAccelType === 'none' || isHwaSelected) && (
                                <>
                                    {isHwaSelected && (
                                        <FormControl>
                                            <FormControlLabel
                                                label={globalize.translate('EnableTonemapping')}
                                                control={
                                                    <Checkbox
                                                        name="EnableTonemapping"
                                                        checked={config.EnableTonemapping}
                                                        onChange={onCheckboxChange}
                                                    />
                                                }
                                            />
                                            <FormHelperText>
                                                {globalize.translate('AllowTonemappingHelp')}
                                            </FormHelperText>
                                        </FormControl>
                                    )}

                                    <Select
                                        name="TonemappingAlgorithm"
                                        value={config.TonemappingAlgorithm || 'none'}
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue
                                                placeholder={globalize.translate(
                                                    'LabelTonemappingAlgorithm'
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                {globalize.translate('None')}
                                            </SelectItem>
                                            <SelectItem value="clip">Clip</SelectItem>
                                            <SelectItem value="linear">Linear</SelectItem>
                                            <SelectItem value="gamma">Gamma</SelectItem>
                                            <SelectItem value="reinhard">Reinhard</SelectItem>
                                            <SelectItem value="hable">Hable</SelectItem>
                                            <SelectItem value="mobius">Mobius</SelectItem>
                                            <SelectItem value="bt2390">BT.2390</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {isHwaSelected && (
                                        <Select
                                            name="TonemappingMode"
                                            value={config.TonemappingMode || 'auto'}
                                        >
                                            <SelectTrigger style={{ width: '100%' }}>
                                                <SelectValue
                                                    placeholder={globalize.translate(
                                                        'LabelTonemappingMode'
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="auto">
                                                    {globalize.translate('Auto')}
                                                </SelectItem>
                                                <SelectItem value="max">MAX</SelectItem>
                                                <SelectItem value="rgb">RGB</SelectItem>
                                                <SelectItem value="lum">LUM</SelectItem>
                                                <SelectItem value="itp">ITP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Select
                                        name="TonemappingRange"
                                        value={config.TonemappingRange || 'auto'}
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue
                                                placeholder={globalize.translate(
                                                    'LabelTonemappingRange'
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">
                                                {globalize.translate('Auto')}
                                            </SelectItem>
                                            <SelectItem value="tv">TV</SelectItem>
                                            <SelectItem value="pc">PC</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        name="TonemappingDesat"
                                        type="number"
                                        value={config.TonemappingDesat}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelTonemappingDesat')}
                                        min={0}
                                        step={0.00001}
                                    />

                                    <Input
                                        name="TonemappingPeak"
                                        type="number"
                                        value={config.TonemappingPeak}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelTonemappingPeak')}
                                        min={0}
                                        step={0.00001}
                                    />

                                    <Input
                                        name="TonemappingParam"
                                        type="number"
                                        value={config.TonemappingParam || ''}
                                        onChange={onConfigChange}
                                        label={globalize.translate('LabelTonemappingParam')}
                                        min={0}
                                        step={0.00001}
                                    />
                                </>
                            )}

                            <Select
                                name="EncodingThreadCount"
                                value={config.EncodingThreadCount?.toString() || '-1'}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue
                                        placeholder={globalize.translate(
                                            'LabelTranscodingThreadCount'
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-1">
                                        {globalize.translate('Auto')}
                                    </SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(
                                        (num) => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num}
                                            </SelectItem>
                                        )
                                    )}
                                    <SelectItem value="0">
                                        {globalize.translate('OptionMax')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                name="EncoderAppPathDisplay"
                                value={config.EncoderAppPathDisplay || ''}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelffmpegPath')}
                                disabled
                            />

                            <Input
                                name="TranscodingTempPath"
                                value={config.TranscodingTempPath || ''}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelTranscodePath')}
                            />

                            <Input
                                name="FallbackFontPath"
                                value={config.FallbackFontPath || ''}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelFallbackFontPath')}
                            />

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('EnableFallbackFont')}
                                    control={
                                        <Checkbox
                                            name="EnableFallbackFont"
                                            checked={config.EnableFallbackFont}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>
                                    {globalize.translate('EnableFallbackFontHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('LabelEnableAudioVbr')}
                                    control={
                                        <Checkbox
                                            name="EnableAudioVbr"
                                            checked={config.EnableAudioVbr}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>
                                    {globalize.translate('LabelEnableAudioVbrHelp')}
                                </FormHelperText>
                            </FormControl>

                            <Input
                                name="DownMixAudioBoost"
                                type="number"
                                value={config.DownMixAudioBoost}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelDownMixAudioScale')}
                                min={0.5}
                                max={3}
                                step={0.1}
                                required
                            />

                            <Select
                                name="DownMixStereoAlgorithm"
                                value={config.DownMixStereoAlgorithm || 'None'}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue
                                        placeholder={globalize.translate(
                                            'LabelStereoDownmixAlgorithm'
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">
                                        {globalize.translate('None')}
                                    </SelectItem>
                                    <SelectItem value="Dave750">Dave750</SelectItem>
                                    <SelectItem value="NightmodeDialogue">
                                        NightmodeDialogue
                                    </SelectItem>
                                    <SelectItem value="Rfc7845">RFC7845</SelectItem>
                                    <SelectItem value="Ac4">AC-4</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                name="MaxMuxingQueueSize"
                                value={config.MaxMuxingQueueSize}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelMaxMuxingQueueSize')}
                            />

                            <Select name="EncoderPreset" value={config.EncoderPreset || 'auto'}>
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue
                                        placeholder={globalize.translate('LabelEncoderPreset')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">
                                        {globalize.translate('Auto')}
                                    </SelectItem>
                                    <SelectItem value="veryslow">veryslow</SelectItem>
                                    <SelectItem value="slower">slower</SelectItem>
                                    <SelectItem value="slow">slow</SelectItem>
                                    <SelectItem value="medium">medium</SelectItem>
                                    <SelectItem value="fast">fast</SelectItem>
                                    <SelectItem value="faster">faster</SelectItem>
                                    <SelectItem value="veryfast">veryfast</SelectItem>
                                    <SelectItem value="superfast">superfast</SelectItem>
                                    <SelectItem value="ultrafast">ultrafast</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                name="H265Crf"
                                type="number"
                                value={config.H265Crf}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelH265Crf')}
                                min={0}
                                max={51}
                                step={1}
                            />

                            <Input
                                name="H264Crf"
                                type="number"
                                value={config.H264Crf}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelH264Crf')}
                                min={0}
                                max={51}
                                step={1}
                            />

                            <Select
                                name="DeinterlaceMethod"
                                value={config.DeinterlaceMethod || 'yadif'}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue
                                        placeholder={globalize.translate('LabelDeinterlaceMethod')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yadif">
                                        {globalize.translate('Yadif')}
                                    </SelectItem>
                                    <SelectItem value="bwdif">
                                        {globalize.translate('Bwdif')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('UseDoubleRateDeinterlacing')}
                                    control={
                                        <Checkbox
                                            name="DeinterlaceDoubleRate"
                                            checked={config.DeinterlaceDoubleRate}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>
                                    {globalize.translate('UseDoubleRateDeinterlacingHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowOnTheFlySubtitleExtraction')}
                                    control={
                                        <Checkbox
                                            name="EnableSubtitleExtraction"
                                            checked={config.EnableSubtitleExtraction}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>
                                    {globalize.translate('AllowOnTheFlySubtitleExtractionHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowFfmpegThrottling')}
                                    control={
                                        <Checkbox
                                            name="EnableThrottling"
                                            checked={config.EnableThrottling}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>
                                    {globalize.translate('AllowFfmpegThrottlingHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    label={globalize.translate('AllowSegmentDeletion')}
                                    control={
                                        <Checkbox
                                            name="EnableSegmentDeletion"
                                            checked={config.EnableSegmentDeletion}
                                            onChange={onCheckboxChange}
                                        />
                                    }
                                />
                                <FormHelperText>
                                    {globalize.translate('AllowSegmentDeletionHelp')}
                                </FormHelperText>
                            </FormControl>

                            <Input
                                name="ThrottleDelaySeconds"
                                type="number"
                                value={config.ThrottleDelaySeconds}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelThrottleDelaySeconds')}
                                min={10}
                                max={3600}
                                step={1}
                            />

                            <Input
                                name="SegmentKeepSeconds"
                                type="number"
                                value={config.SegmentKeepSeconds}
                                onChange={onConfigChange}
                                label={globalize.translate('LabelSegmentKeepSeconds')}
                                min={10}
                                max={3600}
                                step={1}
                            />

                            <Button type="submit">{globalize.translate('Save')}</Button>
                        </Flex>
                    </form>
                )}
            </Flex>
        </Page>
    );
};

Component.displayName = 'TranscodingPage';
