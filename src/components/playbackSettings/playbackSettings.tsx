import { z } from 'zod';
import { useForm } from '@tanstack/react-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { MediaSegmentAction } from 'apps/stable/features/playback/constants/mediaSegmentAction';
import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';
import { getId, getMediaSegmentAction } from 'apps/stable/features/playback/utils/mediaSegmentSettings';
import { AppFeature } from 'constants/appFeature';
import { safeAppHost } from '../apphost';
import browser from '../../scripts/browser';
import appSettings from '../../scripts/settings/appSettings';
import qualityoptions from '../qualityOptions';
import toast from '../toast/toast';
import loading from '../loading/loading';
import { useApi } from 'hooks/useApi';

import { Button } from 'ui-primitives/Button';
import { Box, Flex, FlexCol } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';
import { Input } from 'ui-primitives/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives/Select';
import { Checkbox } from 'ui-primitives/Checkbox';
import { Slider } from 'ui-primitives/Slider';
import { Divider } from 'ui-primitives/Divider';
import { Alert } from 'ui-primitives/Alert';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { Tabs, TabList, Tab, TabPanel } from 'ui-primitives/Tabs';
import { FormSection, FormSelectField, FormSwitchField } from 'apps/dashboard/components/forms/DashboardForm';
import { SpeakerLoudIcon, VideoIcon, PlayIcon, GearIcon } from '@radix-ui/react-icons';

const playbackSettingsSchema = z.object({
    allowedAudioChannels: z.string(),
    audioLanguagePreference: z.string(),
    playDefaultAudioTrack: z.boolean(),
    enableNextEpisodeAutoPlay: z.boolean(),
    preferFmp4HlsContainer: z.boolean(),
    limitSegmentLength: z.boolean(),
    enableCinemaMode: z.boolean(),
    selectAudioNormalization: z.string(),
    enableNextVideoInfoOverlay: z.boolean(),
    rememberAudioSelections: z.boolean(),
    rememberSubtitleSelections: z.boolean(),
    enableSystemExternalPlayers: z.boolean(),
    limitSupportedVideoResolution: z.boolean(),
    preferredTranscodeVideoCodec: z.string(),
    preferredTranscodeVideoAudioCodec: z.string(),
    disableVbrAudioEncoding: z.boolean(),
    alwaysRemuxFlac: z.boolean(),
    alwaysRemuxMp3: z.boolean(),
    enableDts: z.boolean(),
    enableTrueHd: z.boolean(),
    enableHi10p: z.boolean().optional(),
    maxVideoWidth: z.string(),
    maxInNetworkBitrate: z.string(),
    maxInternetBitrate: z.string(),
    maxMusicBitrate: z.string(),
    maxChromecastBitrate: z.string(),
    castReceiverId: z.string(),
    skipForwardLength: z.number(),
    skipBackLength: z.number(),
    crossfadeDuration: z.number(),
    butterchurnEnabled: z.boolean(),
    butterchurnPresetInterval: z.number(),
    threeJsEnabled: z.boolean(),
    frequencyAnalyzerEnabled: z.boolean(),
    waveSurferEnabled: z.boolean()
});

type PlaybackSettingsValues = z.infer<typeof playbackSettingsSchema>;

interface PlaybackSettingsProps {
    userId: string;
    serverId: string;
    userSettings: any;
    onSave?: () => void;
}

const SKIP_LENGTHS = [5, 10, 15, 20, 25, 30];
const MEDIA_SEGMENT_TYPES = [
    MediaSegmentType.Intro,
    MediaSegmentType.Preview,
    MediaSegmentType.Recap,
    MediaSegmentType.Commercial,
    MediaSegmentType.Outro
];

const VIDEO_QUALITY_OPTIONS = [
    { value: '0', label: globalize.translate('Auto') },
    { value: '640', label: '360p' },
    { value: '852', label: '480p' },
    { value: '1280', label: '720p' },
    { value: '1920', label: '1080p' },
    { value: '3840', label: '4K' },
    { value: '7680', label: '8K' }
];

const AUDIO_CHANNELS_OPTIONS = [
    { value: '-1', label: globalize.translate('Auto') },
    { value: '1', label: globalize.translate('LabelSelectMono') },
    { value: '2', label: globalize.translate('LabelSelectStereo') },
    { value: '6', label: '5.1' },
    { value: '8', label: '7.1' }
];

const TRANSCODE_VIDEO_CODEC_OPTIONS = [
    { value: '', label: globalize.translate('Auto') },
    { value: 'h264', label: 'H264' },
    { value: 'hevc', label: 'HEVC' },
    { value: 'av1', label: 'AV1' }
];

const TRANSCODE_AUDIO_CODEC_OPTIONS = [
    { value: '', label: globalize.translate('Auto') },
    { value: 'aac', label: 'AAC' },
    { value: 'ac3', label: 'AC3' },
    { value: 'alac', label: 'ALAC' },
    { value: 'dts', label: 'DTS' },
    { value: 'flac', label: 'FLAC' },
    { value: 'opus', label: 'Opus' }
];

const AUDIO_NORMALIZATION_OPTIONS = [
    { value: 'Off', label: globalize.translate('Off') },
    { value: 'TrackGain', label: globalize.translate('LabelTrackGain') },
    { value: 'AlbumGain', label: globalize.translate('LabelAlbumGain') }
];

interface FormSliderFieldProps {
    name: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    showValue?: boolean;
    unit?: string;
    helpText?: string;
}

function FormSliderField({ label, value, onChange, min, max, step, showValue, unit, helpText }: FormSliderFieldProps) {
    return (
        <Box style={{ marginBottom: '16px' }}>
            <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Text size="sm" weight="medium">
                    {label}
                </Text>
                {showValue && (
                    <Text size="sm" color="secondary">
                        {value}
                        {unit ? ` ${unit}` : ''}
                    </Text>
                )}
            </Flex>
            <Slider value={value} onChange={onChange} min={min} max={max} step={step} style={{ width: '100%' }} />
            {helpText && (
                <Text size="xs" color="secondary" style={{ marginTop: '4px' }}>
                    {helpText}
                </Text>
            )}
        </Box>
    );
}

export function PlaybackSettings({ userId, serverId, userSettings, onSave }: PlaybackSettingsProps) {
    const { api } = useApi();
    const queryClient = useQueryClient();
    const [saveError, setSaveError] = useState<string | null>(null);
    const [endpointInfo, setEndpointInfo] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('audio');

    const apiClient = ServerConnections.getApiClient(serverId);

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => apiClient.getUser(userId)
    });

    const { data: systemInfo, isLoading: systemInfoLoading } = useQuery({
        queryKey: ['systemInfo'],
        queryFn: () => apiClient.getSystemInfo()
    });

    const { data: cultures, isLoading: culturesLoading } = useQuery({
        queryKey: ['cultures'],
        queryFn: () => apiClient.getCultures()
    });

    useEffect(() => {
        if (!safeAppHost.supports(AppFeature.MultiServer)) {
            apiClient
                .getEndpointInfo()
                .then(setEndpointInfo)
                .catch(() => {});
        }
    }, [apiClient]);

    const { data: visualizerConfig, isLoading: visualizerLoading } = useQuery({
        queryKey: ['visualizerConfig'],
        queryFn: async () => {
            try {
                const config = userSettings.visualizerConfiguration();
                if (typeof config === 'string') {
                    return JSON.parse(config);
                }
                return config || {};
            } catch {
                return {};
            }
        }
    });

    const showMultiServerQuality = safeAppHost.supports(AppFeature.MultiServer);
    const isLocalUser = userId === apiClient.getCurrentUserId();
    const canShowQuality =
        isLocalUser && (user?.Policy?.EnableVideoPlaybackTranscoding || user?.Policy?.EnableAudioPlaybackTranscoding);
    const showInNetworkQuality = showMultiServerQuality || endpointInfo?.IsInNetwork;
    const showInternetQuality = showMultiServerQuality || !endpointInfo?.IsInNetwork;

    const form = useForm({
        defaultValues: {
            allowedAudioChannels: userSettings?.allowedAudioChannels() || '-1',
            audioLanguagePreference: user?.Configuration?.AudioLanguagePreference || '',
            playDefaultAudioTrack: user?.Configuration?.PlayDefaultAudioTrack || false,
            enableNextEpisodeAutoPlay: user?.Configuration?.EnableNextEpisodeAutoPlay || false,
            preferFmp4HlsContainer: userSettings?.preferFmp4HlsContainer() || false,
            limitSegmentLength: userSettings?.limitSegmentLength() || false,
            enableCinemaMode: userSettings?.enableCinemaMode() || false,
            selectAudioNormalization: userSettings?.selectAudioNormalization() || 'Off',
            enableNextVideoInfoOverlay: userSettings?.enableNextVideoInfoOverlay() || false,
            rememberAudioSelections: user?.Configuration?.RememberAudioSelections || false,
            rememberSubtitleSelections: user?.Configuration?.RememberSubtitleSelections || false,
            enableSystemExternalPlayers: appSettings.enableSystemExternalPlayers() || false,
            limitSupportedVideoResolution: appSettings.limitSupportedVideoResolution() || false,
            preferredTranscodeVideoCodec: appSettings.preferredTranscodeVideoCodec() || '',
            preferredTranscodeVideoAudioCodec: appSettings.preferredTranscodeVideoAudioCodec() || '',
            disableVbrAudioEncoding: appSettings.disableVbrAudio() || false,
            alwaysRemuxFlac: appSettings.alwaysRemuxFlac() || false,
            alwaysRemuxMp3: appSettings.alwaysRemuxMp3() || false,
            enableDts: appSettings.enableDts() || false,
            enableTrueHd: appSettings.enableTrueHd() || false,
            enableHi10p: browser.safari ? appSettings.enableHi10p() : undefined,
            maxVideoWidth: String(appSettings.maxVideoWidth() || 0),
            maxInNetworkBitrate: '',
            maxInternetBitrate: '',
            maxMusicBitrate: '',
            maxChromecastBitrate: String(appSettings.maxChromecastBitrate() || ''),
            castReceiverId: user?.Configuration?.CastReceiverId || '',
            skipForwardLength: userSettings?.skipForwardLength() || 10,
            skipBackLength: userSettings?.skipBackLength() || 10,
            crossfadeDuration: userSettings?.crossfadeDuration() || 3,
            butterchurnEnabled: visualizerConfig?.butterchurn?.enabled || false,
            butterchurnPresetInterval: visualizerConfig?.butterchurn?.presetInterval || 60,
            threeJsEnabled: visualizerConfig?.threeJs?.enabled || false,
            frequencyAnalyzerEnabled: visualizerConfig?.frequencyAnalyzer?.enabled || false,
            waveSurferEnabled: visualizerConfig?.waveSurfer?.enabled || false
        } as PlaybackSettingsValues,
        onSubmit: async ({ value }) => {
            setSaveError(null);
            loading.show();

            try {
                appSettings.enableSystemExternalPlayers(value.enableSystemExternalPlayers);
                appSettings.maxChromecastBitrate(value.maxChromecastBitrate);
                appSettings.maxVideoWidth(value.maxVideoWidth);
                appSettings.limitSupportedVideoResolution(value.limitSupportedVideoResolution);
                appSettings.preferredTranscodeVideoCodec(value.preferredTranscodeVideoCodec);
                appSettings.preferredTranscodeVideoAudioCodec(value.preferredTranscodeVideoAudioCodec);
                appSettings.enableDts(value.enableDts);
                appSettings.enableTrueHd(value.enableTrueHd);
                if (browser.safari && value.enableHi10p !== undefined) {
                    appSettings.enableHi10p(value.enableHi10p);
                }
                appSettings.disableVbrAudio(value.disableVbrAudioEncoding);
                appSettings.alwaysRemuxFlac(value.alwaysRemuxFlac);
                appSettings.alwaysRemuxMp3(value.alwaysRemuxMp3);

                userSettings.allowedAudioChannels(value.allowedAudioChannels);
                userSettings.preferFmp4HlsContainer(value.preferFmp4HlsContainer);
                userSettings.limitSegmentLength(value.limitSegmentLength);
                userSettings.enableCinemaMode(value.enableCinemaMode);
                userSettings.selectAudioNormalization(value.selectAudioNormalization);
                userSettings.enableNextVideoInfoOverlay(value.enableNextVideoInfoOverlay);
                userSettings.skipForwardLength(value.skipForwardLength);
                userSettings.skipBackLength(value.skipBackLength);
                userSettings.crossfadeDuration(value.crossfadeDuration);

                if (user) {
                    user.Configuration.AudioLanguagePreference = value.audioLanguagePreference;
                    user.Configuration.PlayDefaultAudioTrack = value.playDefaultAudioTrack;
                    user.Configuration.EnableNextEpisodeAutoPlay = value.enableNextEpisodeAutoPlay;
                    user.Configuration.RememberAudioSelections = value.rememberAudioSelections;
                    user.Configuration.RememberSubtitleSelections = value.rememberSubtitleSelections;
                    user.Configuration.CastReceiverId = value.castReceiverId;

                    await apiClient.updateUserConfiguration(user.Id, user.Configuration);
                }

                toast(globalize.translate('SettingsSaved'));
                onSave?.();
            } catch (error) {
                setSaveError(error instanceof Error ? error.message : globalize.translate('ErrorDefault'));
            } finally {
                loading.hide();
            }
        }
    });

    const isLoading = userLoading || systemInfoLoading || culturesLoading || visualizerLoading;

    if (isLoading) {
        return (
            <Box style={{ padding: '48px', textAlign: 'center' }}>
                <CircularProgress size="lg" />
                <Text style={{ marginTop: '16px' }}>{globalize.translate('Loading')}</Text>
            </Box>
        );
    }

    if (!user || !systemInfo) {
        return null;
    }

    const mediaSegmentActions = MEDIA_SEGMENT_TYPES.map(type => ({
        type,
        id: getId(type),
        label: globalize.translate('LabelMediaSegmentsType', globalize.translate(`MediaSegmentType.${type}`)),
        value: getMediaSegmentAction(userSettings, type)
    }));

    return (
        <Box style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
            {saveError && (
                <Alert variant="error" style={{ marginBottom: '24px' }}>
                    {saveError}
                </Alert>
            )}

            <form
                onSubmit={e => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
            >
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabList>
                        <Tab value="audio">
                            <SpeakerLoudIcon style={{ marginRight: 8, width: 20, height: 20 }} />
                            {globalize.translate('Audio')}
                        </Tab>
                        <Tab value="video">
                            <VideoIcon style={{ marginRight: 8, width: 20, height: 20 }} />
                            {globalize.translate('Video')}
                        </Tab>
                        <Tab value="playback">
                            <PlayIcon style={{ marginRight: 8, width: 20, height: 20 }} />
                            {globalize.translate('Playback')}
                        </Tab>
                        <Tab value="advanced">
                            <GearIcon style={{ marginRight: 8, width: 20, height: 20 }} />
                            {globalize.translate('TabAdvanced')}
                        </Tab>
                    </TabList>

                    <TabPanel value="audio">
                        <FormSection title={globalize.translate('HeaderAudioSettings')}>
                            <FlexCol style={{ gap: 16 }}>
                                <FormSelectField
                                    name="allowedAudioChannels"
                                    label={globalize.translate('LabelAllowedAudioChannels')}
                                    value={form.state.values.allowedAudioChannels}
                                    onChange={val => form.setFieldValue('allowedAudioChannels', val)}
                                    options={AUDIO_CHANNELS_OPTIONS}
                                />

                                <FormSelectField
                                    name="audioLanguagePreference"
                                    label={globalize.translate('LabelAudioLanguagePreference')}
                                    value={form.state.values.audioLanguagePreference}
                                    onChange={val => form.setFieldValue('audioLanguagePreference', val)}
                                    options={[
                                        { value: '', label: globalize.translate('AnyLanguage') },
                                        ...(cultures?.map((c: any) => ({
                                            value: c.ThreeLetterISOLanguageName,
                                            label: c.DisplayName
                                        })) || [])
                                    ]}
                                />

                                <FormSwitchField
                                    name="playDefaultAudioTrack"
                                    label={globalize.translate('LabelPlayDefaultAudioTrack')}
                                    checked={form.state.values.playDefaultAudioTrack}
                                    onChange={checked => form.setFieldValue('playDefaultAudioTrack', checked)}
                                />

                                <FormSliderField
                                    name="crossfadeDuration"
                                    label={globalize.translate('CrossfadeDuration')}
                                    value={form.state.values.crossfadeDuration}
                                    onChange={val => form.setFieldValue('crossfadeDuration', val)}
                                    min={0}
                                    max={6}
                                    step={0.01}
                                    showValue
                                    unit="s"
                                    helpText={globalize.translate('CrossfadeDurationHelp')}
                                />
                            </FlexCol>
                        </FormSection>

                        <FormSection title={globalize.translate('HeaderVisualizer')}>
                            <FlexCol style={{ gap: 16 }}>
                                <FormSwitchField
                                    name="butterchurnEnabled"
                                    label={globalize.translate('EnableButterchurn')}
                                    checked={form.state.values.butterchurnEnabled}
                                    onChange={checked => form.setFieldValue('butterchurnEnabled', checked)}
                                />

                                {form.state.values.butterchurnEnabled && (
                                    <FormSliderField
                                        name="butterchurnPresetInterval"
                                        label={globalize.translate('ButterchurnPresetInterval')}
                                        value={form.state.values.butterchurnPresetInterval}
                                        onChange={val => form.setFieldValue('butterchurnPresetInterval', val)}
                                        min={10}
                                        max={120}
                                        step={1}
                                        showValue
                                        unit="s"
                                    />
                                )}

                                <FormSwitchField
                                    name="threeJsEnabled"
                                    label={globalize.translate('Enable 3D Visualizer (Experimental)')}
                                    checked={form.state.values.threeJsEnabled}
                                    onChange={checked => form.setFieldValue('threeJsEnabled', checked)}
                                />

                                <FormSwitchField
                                    name="frequencyAnalyzerEnabled"
                                    label={globalize.translate('EnableFrequencyAnalyzer')}
                                    checked={form.state.values.frequencyAnalyzerEnabled}
                                    onChange={checked => form.setFieldValue('frequencyAnalyzerEnabled', checked)}
                                />

                                <FormSwitchField
                                    name="waveSurferEnabled"
                                    label={globalize.translate('EnableWavesurfer')}
                                    checked={form.state.values.waveSurferEnabled}
                                    onChange={checked => form.setFieldValue('waveSurferEnabled', checked)}
                                />
                            </FlexCol>
                        </FormSection>

                        <FormSection title={globalize.translate('HeaderAudioAdvanced')}>
                            <FlexCol style={{ gap: 16 }}>
                                <FormSelectField
                                    name="selectAudioNormalization"
                                    label={globalize.translate('LabelSelectAudioNormalization')}
                                    value={form.state.values.selectAudioNormalization}
                                    onChange={val => form.setFieldValue('selectAudioNormalization', val)}
                                    options={AUDIO_NORMALIZATION_OPTIONS}
                                />

                                <FormSwitchField
                                    name="alwaysRemuxFlac"
                                    label={globalize.translate('LabelAlwaysRemuxFlacAudioFiles')}
                                    checked={form.state.values.alwaysRemuxFlac}
                                    onChange={checked => form.setFieldValue('alwaysRemuxFlac', checked)}
                                />

                                <FormSwitchField
                                    name="alwaysRemuxMp3"
                                    label={globalize.translate('LabelAlwaysRemuxMp3AudioFiles')}
                                    checked={form.state.values.alwaysRemuxMp3}
                                    onChange={checked => form.setFieldValue('alwaysRemuxMp3', checked)}
                                />

                                <FormSwitchField
                                    name="disableVbrAudioEncoding"
                                    label={globalize.translate('LabelDisableVbrAudioEncoding')}
                                    checked={form.state.values.disableVbrAudioEncoding}
                                    onChange={checked => form.setFieldValue('disableVbrAudioEncoding', checked)}
                                />
                            </FlexCol>
                        </FormSection>
                    </TabPanel>

                    <TabPanel value="video">
                        <FormSection title={globalize.translate('HeaderVideoQuality')}>
                            {canShowQuality && (
                                <FlexCol style={{ gap: 16 }}>
                                    {showInNetworkQuality && (
                                        <FormSelectField
                                            name="maxInNetworkBitrate"
                                            label={globalize.translate('LabelHomeNetworkQuality')}
                                            value={form.state.values.maxInNetworkBitrate}
                                            onChange={val => form.setFieldValue('maxInNetworkBitrate', val)}
                                            options={[
                                                { value: '', label: globalize.translate('Auto') },
                                                ...qualityoptions
                                                    .getVideoQualityOptions({
                                                        currentMaxBitrate: appSettings.maxStreamingBitrate(
                                                            true,
                                                            'Video'
                                                        ),
                                                        isAutomaticBitrateEnabled:
                                                            appSettings.enableAutomaticBitrateDetection(true, 'Video'),
                                                        enableAuto: true
                                                    })
                                                    .map((opt: any) => ({
                                                        value: String(opt.bitrate || ''),
                                                        label: opt.name
                                                    }))
                                            ]}
                                        />
                                    )}

                                    {showInternetQuality && (
                                        <FormSelectField
                                            name="maxInternetBitrate"
                                            label={globalize.translate('LabelInternetQuality')}
                                            value={form.state.values.maxInternetBitrate}
                                            onChange={val => form.setFieldValue('maxInternetBitrate', val)}
                                            options={[
                                                { value: '', label: globalize.translate('Auto') },
                                                ...qualityoptions
                                                    .getVideoQualityOptions({
                                                        currentMaxBitrate: appSettings.maxStreamingBitrate(
                                                            false,
                                                            'Video'
                                                        ),
                                                        isAutomaticBitrateEnabled:
                                                            appSettings.enableAutomaticBitrateDetection(false, 'Video'),
                                                        enableAuto: true
                                                    })
                                                    .map((opt: any) => ({
                                                        value: String(opt.bitrate || ''),
                                                        label: opt.name
                                                    }))
                                            ]}
                                        />
                                    )}

                                    {isLocalUser &&
                                        safeAppHost.supports(AppFeature.Chromecast) &&
                                        user.Policy.EnableVideoPlaybackTranscoding && (
                                            <FormSelectField
                                                name="maxChromecastBitrate"
                                                label={globalize.translate('LabelMaxChromecastBitrate')}
                                                value={form.state.values.maxChromecastBitrate}
                                                onChange={val => form.setFieldValue('maxChromecastBitrate', val)}
                                                options={[
                                                    { value: '', label: globalize.translate('Auto') },
                                                    ...qualityoptions
                                                        .getVideoQualityOptions({
                                                            currentMaxBitrate: appSettings.maxChromecastBitrate(),
                                                            isAutomaticBitrateEnabled:
                                                                !appSettings.maxChromecastBitrate(),
                                                            enableAuto: true
                                                        })
                                                        .map((opt: any) => ({
                                                            value: String(opt.bitrate || ''),
                                                            label: opt.name
                                                        }))
                                                ]}
                                            />
                                        )}

                                    <FormSelectField
                                        name="maxVideoWidth"
                                        label={globalize.translate('LabelMaxVideoResolution')}
                                        value={form.state.values.maxVideoWidth}
                                        onChange={val => form.setFieldValue('maxVideoWidth', val)}
                                        options={VIDEO_QUALITY_OPTIONS}
                                    />

                                    <FormSwitchField
                                        name="limitSupportedVideoResolution"
                                        label={globalize.translate('LimitSupportedVideoResolution')}
                                        checked={form.state.values.limitSupportedVideoResolution}
                                        onChange={checked =>
                                            form.setFieldValue('limitSupportedVideoResolution', checked)
                                        }
                                    />
                                </FlexCol>
                            )}
                        </FormSection>

                        {showInternetQuality && user.Policy.EnableAudioPlaybackTranscoding && (
                            <FormSection title={globalize.translate('HeaderMusicQuality')}>
                                <FormSelectField
                                    name="maxMusicBitrate"
                                    label={globalize.translate('LabelInternetQuality')}
                                    value={form.state.values.maxMusicBitrate}
                                    onChange={val => form.setFieldValue('maxMusicBitrate', val)}
                                    options={[
                                        { value: '', label: globalize.translate('Auto') },
                                        ...qualityoptions
                                            .getAudioQualityOptions({
                                                currentMaxBitrate: appSettings.maxStreamingBitrate(false, 'Audio'),
                                                isAutomaticBitrateEnabled: appSettings.enableAutomaticBitrateDetection(
                                                    false,
                                                    'Audio'
                                                ),
                                                enableAuto: true
                                            })
                                            .map((opt: any) => ({
                                                value: String(opt.bitrate || ''),
                                                label: opt.name
                                            }))
                                    ]}
                                />
                            </FormSection>
                        )}

                        <FormSection title={globalize.translate('HeaderVideoAdvanced')}>
                            <FlexCol style={{ gap: 16 }}>
                                <FormSwitchField
                                    name="enableDts"
                                    label={globalize.translate('EnableDts')}
                                    checked={form.state.values.enableDts}
                                    onChange={checked => form.setFieldValue('enableDts', checked)}
                                />

                                <FormSwitchField
                                    name="enableTrueHd"
                                    label={globalize.translate('EnableTrueHd')}
                                    checked={form.state.values.enableTrueHd}
                                    onChange={checked => form.setFieldValue('enableTrueHd', checked)}
                                />

                                {browser.safari && (
                                    <FormSwitchField
                                        name="enableHi10p"
                                        label={globalize.translate('EnableHi10p')}
                                        checked={form.state.values.enableHi10p || false}
                                        onChange={checked => form.setFieldValue('enableHi10p', checked)}
                                    />
                                )}

                                {browser.web0s && (
                                    <FormSwitchField
                                        name="limitSegmentLength"
                                        label={globalize.translate('LimitSegmentLength')}
                                        checked={form.state.values.limitSegmentLength}
                                        onChange={checked => form.setFieldValue('limitSegmentLength', checked)}
                                    />
                                )}

                                <FormSelectField
                                    name="preferredTranscodeVideoCodec"
                                    label={globalize.translate('LabelSelectPreferredTranscodeVideoCodec')}
                                    value={form.state.values.preferredTranscodeVideoCodec}
                                    onChange={val => form.setFieldValue('preferredTranscodeVideoCodec', val)}
                                    options={TRANSCODE_VIDEO_CODEC_OPTIONS}
                                />

                                <FormSelectField
                                    name="preferredTranscodeVideoAudioCodec"
                                    label={globalize.translate('LabelSelectPreferredTranscodeVideoAudioCodec')}
                                    value={form.state.values.preferredTranscodeVideoAudioCodec}
                                    onChange={val => form.setFieldValue('preferredTranscodeVideoAudioCodec', val)}
                                    options={TRANSCODE_AUDIO_CODEC_OPTIONS}
                                />
                            </FlexCol>
                        </FormSection>
                    </TabPanel>

                    <TabPanel value="playback">
                        <FormSection title={globalize.translate('TabPlayback')}>
                            <FlexCol style={{ gap: 16 }}>
                                <FormSwitchField
                                    name="preferFmp4HlsContainer"
                                    label={globalize.translate('PreferFmp4HlsContainer')}
                                    checked={form.state.values.preferFmp4HlsContainer}
                                    onChange={checked => form.setFieldValue('preferFmp4HlsContainer', checked)}
                                />

                                <FormSwitchField
                                    name="enableCinemaMode"
                                    label={globalize.translate('EnableCinemaMode')}
                                    checked={form.state.values.enableCinemaMode}
                                    onChange={checked => form.setFieldValue('enableCinemaMode', checked)}
                                />

                                <FormSwitchField
                                    name="enableNextEpisodeAutoPlay"
                                    label={globalize.translate('PlayNextEpisodeAutomatically')}
                                    checked={form.state.values.enableNextEpisodeAutoPlay}
                                    onChange={checked => form.setFieldValue('enableNextEpisodeAutoPlay', checked)}
                                />

                                <FormSwitchField
                                    name="rememberAudioSelections"
                                    label={globalize.translate('RememberAudioSelections')}
                                    checked={form.state.values.rememberAudioSelections}
                                    onChange={checked => form.setFieldValue('rememberAudioSelections', checked)}
                                />

                                <FormSwitchField
                                    name="rememberSubtitleSelections"
                                    label={globalize.translate('RememberSubtitleSelections')}
                                    checked={form.state.values.rememberSubtitleSelections}
                                    onChange={checked => form.setFieldValue('rememberSubtitleSelections', checked)}
                                />

                                <FormSwitchField
                                    name="enableNextVideoInfoOverlay"
                                    label={globalize.translate('EnableNextVideoInfoOverlay')}
                                    checked={form.state.values.enableNextVideoInfoOverlay}
                                    onChange={checked => form.setFieldValue('enableNextVideoInfoOverlay', checked)}
                                />

                                <FormSelectField
                                    name="skipForwardLength"
                                    label={globalize.translate('LabelSkipForwardLength')}
                                    value={String(form.state.values.skipForwardLength)}
                                    onChange={val => form.setFieldValue('skipForwardLength', parseInt(val) / 1000)}
                                    options={SKIP_LENGTHS.map(len => ({
                                        value: String(len * 1000),
                                        label: globalize.translate('ValueSeconds', len)
                                    }))}
                                />

                                <FormSelectField
                                    name="skipBackLength"
                                    label={globalize.translate('LabelSkipBackLength')}
                                    value={String(form.state.values.skipBackLength)}
                                    onChange={val => form.setFieldValue('skipBackLength', parseInt(val) / 1000)}
                                    options={SKIP_LENGTHS.map(len => ({
                                        value: String(len * 1000),
                                        label: globalize.translate('ValueSeconds', len)
                                    }))}
                                />
                            </FlexCol>
                        </FormSection>

                        <FormSection title={globalize.translate('HeaderMediaSegmentActions')}>
                            <FlexCol style={{ gap: 16 }}>
                                {mediaSegmentActions.map(action => (
                                    <FormSelectField
                                        key={action.id}
                                        name={action.id}
                                        label={action.label}
                                        value={action.value}
                                        onChange={val => userSettings.set(action.id, val, false)}
                                        options={Object.values(MediaSegmentAction).map(act => ({
                                            value: act,
                                            label: globalize.translate(`MediaSegmentAction.${act}`)
                                        }))}
                                    />
                                ))}
                            </FlexCol>
                        </FormSection>

                        <FormSection title={globalize.translate('HeaderExternalPlayers')}>
                            {safeAppHost.supports(AppFeature.ExternalPlayerIntent) && isLocalUser && (
                                <FormSwitchField
                                    name="enableSystemExternalPlayers"
                                    label={globalize.translate('EnableExternalVideoPlayers')}
                                    checked={form.state.values.enableSystemExternalPlayers}
                                    onChange={checked => form.setFieldValue('enableSystemExternalPlayers', checked)}
                                />
                            )}

                            <FormSelectField
                                name="castReceiverId"
                                label={globalize.translate('LabelChromecastVersion')}
                                value={form.state.values.castReceiverId}
                                onChange={val => form.setFieldValue('castReceiverId', val)}
                                options={(systemInfo.CastReceiverApplications || []).map((app: any) => ({
                                    value: app.Id,
                                    label: app.Name
                                }))}
                            />
                        </FormSection>
                    </TabPanel>

                    <TabPanel value="advanced">
                        <Box style={{ textAlign: 'center', padding: '48px' }}>
                            <Text color="secondary">{globalize.translate('AdvancedSettingsComingSoon')}</Text>
                        </Box>
                    </TabPanel>
                </Tabs>

                <Flex justify="flex-end" gap="12px" style={{ marginTop: '24px' }}>
                    <Button type="submit" variant="primary" loading={isLoading}>
                        {globalize.translate('Save')}
                    </Button>
                </Flex>
            </form>
        </Box>
    );
}

export default PlaybackSettings;
