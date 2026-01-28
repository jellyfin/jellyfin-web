import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useField } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { AppFeature } from 'constants/appFeature';
import { safeAppHost } from '../apphost';
import browser from '../../scripts/browser';
import appSettings from '../../scripts/settings/appSettings';
import layoutManager from '../layoutManager';
import toast from '../toast/toast';
import { vars } from '../../styles/tokens.css';

import { Box, Flex, FlexCol } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { Input } from 'ui-primitives/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives/Select';
import { Checkbox } from 'ui-primitives/Checkbox';
import { FormControl, FormLabel, FormHelperText } from 'ui-primitives/FormControl';
import { Slider } from 'ui-primitives/Slider';
import { Divider } from 'ui-primitives/Divider';
import { Alert } from 'ui-primitives/Alert';
import { CircularProgress } from 'ui-primitives/CircularProgress';

const subtitleSettingsSchema = z.object({
    subtitleLanguage: z.string(),
    subtitlePlaybackMode: z.enum(['Default', 'Smart', 'OnlyForced', 'Always', 'None']),
    subtitleBurnIn: z.string(),
    renderPgsSubtitle: z.boolean(),
    alwaysBurnInSubtitleWhenTranscoding: z.boolean(),
    subtitleStyling: z.enum(['Auto', 'Custom', 'Native']),
    textSize: z.enum(['smaller', 'small', '', 'large', 'larger', 'extralarge']),
    textWeight: z.enum(['normal', 'bold']),
    font: z.string(),
    textBackground: z.string(),
    textColor: z.string(),
    dropShadow: z.enum(['none', 'raised', 'depressed', 'uniform', '']),
    verticalPosition: z.number()
});

type SubtitleSettingsValues = z.infer<typeof subtitleSettingsSchema>;

interface SubtitleSettingsProps {
    userId: string;
    serverId: string;
    userSettings: any;
    onSave?: () => void;
}

const TEXT_SIZE_OPTIONS = [
    { value: 'smaller', label: globalize.translate('Smaller') },
    { value: 'small', label: globalize.translate('Small') },
    { value: '', label: globalize.translate('Normal') },
    { value: 'large', label: globalize.translate('Large') },
    { value: 'larger', label: globalize.translate('Larger') },
    { value: 'extralarge', label: globalize.translate('ExtraLarge') }
];

const TEXT_WEIGHT_OPTIONS = [
    { value: 'normal', label: globalize.translate('Normal') },
    { value: 'bold', label: globalize.translate('Bold') }
];

const FONT_OPTIONS = [
    { value: '', label: globalize.translate('Default') },
    { value: 'typewriter', label: globalize.translate('Typewriter') },
    { value: 'print', label: globalize.translate('Print') },
    { value: 'console', label: globalize.translate('Console') },
    { value: 'cursive', label: globalize.translate('Cursive') },
    { value: 'casual', label: globalize.translate('Casual') },
    { value: 'smallcaps', label: globalize.translate('SmallCaps') }
];

const DROP_SHADOW_OPTIONS = [
    { value: 'none', label: globalize.translate('None') },
    { value: 'raised', label: globalize.translate('Raised') },
    { value: 'depressed', label: globalize.translate('Depressed') },
    { value: 'uniform', label: globalize.translate('Uniform') },
    { value: '', label: globalize.translate('DropShadow') }
];

const TEXT_COLOR_OPTIONS = [
    { value: '#ffffff', label: globalize.translate('SubtitleWhite') },
    { value: '#d3d3d3', label: globalize.translate('SubtitleLightGray') },
    { value: '#808080', label: globalize.translate('SubtitleGray') },
    { value: '#ffff00', label: globalize.translate('SubtitleYellow') },
    { value: '#008000', label: globalize.translate('SubtitleGreen') },
    { value: '#00ffff', label: globalize.translate('SubtitleCyan') },
    { value: '#0000ff', label: globalize.translate('SubtitleBlue') },
    { value: '#ff00ff', label: globalize.translate('SubtitleMagenta') },
    { value: '#ff0000', label: globalize.translate('SubtitleRed') },
    { value: '#000000', label: globalize.translate('SubtitleBlack') }
];

const SUBTITLE_PLAYBACK_MODE_OPTIONS = [
    { value: 'Default', label: globalize.translate('Default') },
    { value: 'Smart', label: globalize.translate('Smart') },
    { value: 'OnlyForced', label: globalize.translate('OnlyForcedSubtitles') },
    { value: 'Always', label: globalize.translate('AlwaysPlaySubtitles') },
    { value: 'None', label: globalize.translate('None') }
];

const SUBTITLE_BURN_IN_OPTIONS = [
    { value: '', label: globalize.translate('Auto') },
    { value: 'onlyimageformats', label: globalize.translate('OnlyImageFormats') },
    { value: 'allcomplexformats', label: globalize.translate('AllComplexFormats') },
    { value: 'all', label: globalize.translate('All') }
];

const SUBTITLE_STYLING_OPTIONS = [
    { value: 'Auto', label: globalize.translate('Auto') },
    { value: 'Custom', label: globalize.translate('Custom') },
    { value: 'Native', label: globalize.translate('Native') }
];

export function SubtitleSettings({ userId, serverId, userSettings, onSave }: SubtitleSettingsProps) {
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showAppearanceSection, setShowAppearanceSection] = useState(false);

    const apiClient = ServerConnections.getApiClient(serverId);

    const { data: cultures, isLoading: culturesLoading } = useQuery({
        queryKey: ['cultures'],
        queryFn: () => apiClient.getCultures()
    });

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => apiClient.getUser(userId)
    });

    const languageOptions = [
        { value: '', label: globalize.translate('AnyLanguage') },
        ...(cultures?.map((c: any) => ({
            value: c.ThreeLetterISOLanguageName,
            label: c.DisplayName
        })) || [])
    ];

    const canShowBurnIn =
        safeAppHost.supports(AppFeature.SubtitleBurnIn) && user?.Policy?.EnableVideoPlaybackTranscoding;

    const form = useForm({
        defaultValues: {
            subtitleLanguage: user?.Configuration?.SubtitleLanguagePreference || '',
            subtitlePlaybackMode:
                (user?.Configuration?.SubtitleMode as 'Default' | 'Smart' | 'OnlyForced' | 'Always' | 'None') ||
                'Default',
            subtitleBurnIn: '',
            renderPgsSubtitle: false,
            alwaysBurnInSubtitleWhenTranscoding: false,
            subtitleStyling: 'Auto',
            textSize: '',
            textWeight: 'normal',
            font: '',
            textBackground: '',
            textColor: layoutManager.tv ? '#ffffff' : '#000000',
            dropShadow: 'none',
            verticalPosition: 0
        } as SubtitleSettingsValues,
        onSubmit: async ({ value }) => {
            setSaveError(null);
            try {
                userSettings.subtitleLanguagePreference(value.subtitleLanguage);
                userSettings.subtitlePlaybackMode(value.subtitlePlaybackMode);
                userSettings.subtitleStyling(value.subtitleStyling);
                userSettings.subtitleTextSize(value.textSize);
                userSettings.subtitleTextWeight(value.textWeight);
                userSettings.subtitleFont(value.font);
                userSettings.subtitleTextBackground(value.textBackground);
                userSettings.subtitleTextColor(value.textColor);
                userSettings.subtitleDropShadow(value.dropShadow);
                userSettings.subtitleVerticalPosition(value.verticalPosition);

                if (user && user.Configuration) {
                    const config = { ...user.Configuration };
                    config.SubtitleLanguagePreference = value.subtitleLanguage || '';
                    config.SubtitleMode = value.subtitlePlaybackMode;

                    await apiClient.updateUserConfiguration(user.Id ?? '', config as any);
                }

                toast(globalize.translate('SettingsSaved'));
                onSave?.();
            } catch (error) {
                setSaveError(error instanceof Error ? error.message : globalize.translate('ErrorDefault'));
            }
        }
    });

    const isLoading = culturesLoading || userLoading;

    if (isLoading) {
        return (
            <Box style={{ padding: vars.spacing['6'], textAlign: 'center' }}>
                <CircularProgress size="lg" />
                <Text style={{ marginTop: vars.spacing['4'] }}>{globalize.translate('Loading')}</Text>
            </Box>
        );
    }

    return (
        <Box style={{ maxWidth: '800px', margin: '0 auto', padding: vars.spacing['5'] }}>
            {saveError && (
                <Alert variant="error" style={{ marginBottom: vars.spacing['5'] }}>
                    {saveError}
                </Alert>
            )}

            <form
                onSubmit={e => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
            >
                <Box style={{ marginBottom: vars.spacing['6'] }}>
                    <Heading.H3 style={{ marginBottom: vars.spacing['4'] }}>{globalize.translate('Subtitles')}</Heading.H3>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel>{globalize.translate('LabelPreferredSubtitleLanguage')}</FormLabel>
                            <Select
                                value={form.state.values.subtitleLanguage}
                                onValueChange={(value: string) => form.setFieldValue('subtitleLanguage', value)}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('Auto')} />
                                    <SelectContent>
                                        {languageOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectTrigger>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel>{globalize.translate('LabelSubtitlePlaybackMode')}</FormLabel>
                            <Select
                                value={form.state.values.subtitlePlaybackMode}
                                onValueChange={(value: 'Default' | 'Smart' | 'OnlyForced' | 'Always' | 'None') =>
                                    form.setFieldValue('subtitlePlaybackMode', value)
                                }
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue />
                                    <SelectContent>
                                        {SUBTITLE_PLAYBACK_MODE_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectTrigger>
                            </Select>
                        </FormControl>
                        <FormHelperText>
                            {form.state.values.subtitlePlaybackMode === 'Default' &&
                                globalize.translate('DefaultSubtitlesHelp')}
                            {form.state.values.subtitlePlaybackMode === 'Smart' &&
                                globalize.translate('SmartSubtitlesHelp')}
                            {form.state.values.subtitlePlaybackMode === 'Always' &&
                                globalize.translate('AlwaysPlaySubtitlesHelp')}
                            {form.state.values.subtitlePlaybackMode === 'OnlyForced' &&
                                globalize.translate('OnlyForcedSubtitlesHelp')}
                            {form.state.values.subtitlePlaybackMode === 'None' &&
                                globalize.translate('NoSubtitlesHelp')}
                        </FormHelperText>
                    </Box>

                    {canShowBurnIn && (
                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelBurnSubtitles')}</FormLabel>
                                <Select
                                    value={form.state.values.subtitleBurnIn}
                                    onValueChange={(value: string) => form.setFieldValue('subtitleBurnIn', value)}
                                >
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('Auto')} />
                                        <SelectContent>
                                            {SUBTITLE_BURN_IN_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectTrigger>
                                </Select>
                            </FormControl>
                            <FormHelperText>{globalize.translate('BurnSubtitlesHelp')}</FormHelperText>
                        </Box>
                    )}

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={form.state.values.alwaysBurnInSubtitleWhenTranscoding}
                                    onChange={e =>
                                        form.setFieldValue('alwaysBurnInSubtitleWhenTranscoding', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('AlwaysBurnInSubtitleWhenTranscoding')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: vars.spacing['6'] }}>
                                {globalize.translate('AlwaysBurnInSubtitleWhenTranscodingHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>
                </Box>

                <Divider style={{ margin: `${vars.spacing['5']} 0` }} />

                <Box style={{ marginBottom: vars.spacing['6'] }}>
                    <Flex style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: vars.spacing['4'] }}>
                        <Heading.H3 style={{ marginBottom: 0 }}>
                            {globalize.translate('HeaderSubtitleAppearance')}
                        </Heading.H3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAppearanceSection(!showAppearanceSection)}
                        >
                            {showAppearanceSection ? globalize.translate('Hide') : globalize.translate('Show')}
                        </Button>
                    </Flex>

                    {showAppearanceSection && (
                        <Box style={{ marginTop: vars.spacing['4'] }}>
                            <Box style={{ marginBottom: vars.spacing['6'] }}>
                                <Box
                                    style={{
                                        padding: vars.spacing['5'],
                                        background: 'linear-gradient(140deg, #aa5cc3, #00a4dc)',
                                        borderRadius: vars.borderRadius.md,
                                        marginBottom: vars.spacing['4']
                                    }}
                                >
                                    <Box
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            padding: vars.spacing['4'],
                                            borderRadius: vars.borderRadius.sm,
                                            color: form.state.values.textColor,
                                            textAlign: 'center',
                                            fontSize: vars.typography['2'].fontSize
                                        }}
                                    >
                                        {globalize.translate('TheseSettingsAffectSubtitlesOnThisDevice')}
                                    </Box>
                                </Box>
                                <Text size="sm" color="secondary">
                                    {globalize.translate('SubtitleAppearanceSettingsDisclaimer')}
                                </Text>
                                <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                                    {globalize.translate('SubtitleAppearanceSettingsAlsoPassedToCastDevices')}
                                </Text>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{globalize.translate('LabelSubtitleStyling')}</FormLabel>
                                    <Select
                                        value={form.state.values.subtitleStyling}
                                        onValueChange={(value: 'Auto' | 'Custom' | 'Native') =>
                                            form.setFieldValue('subtitleStyling', value)
                                        }
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue />
                                            <SelectContent>
                                                {SUBTITLE_STYLING_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </SelectTrigger>
                                    </Select>
                                </FormControl>
                                <FormHelperText>
                                    {form.state.values.subtitleStyling === 'Auto' &&
                                        globalize.translate('AutoSubtitleStylingHelp')}
                                    {form.state.values.subtitleStyling === 'Custom' &&
                                        globalize.translate('CustomSubtitleStylingHelp')}
                                    {form.state.values.subtitleStyling === 'Native' &&
                                        globalize.translate('NativeSubtitleStylingHelp')}
                                </FormHelperText>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{globalize.translate('LabelTextSize')}</FormLabel>
                                    <Select
                                        value={form.state.values.textSize}
                                        onValueChange={(value: typeof form.state.values.textSize) =>
                                            form.setFieldValue('textSize', value)
                                        }
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue />
                                            <SelectContent>
                                                {TEXT_SIZE_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </SelectTrigger>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{globalize.translate('LabelTextWeight')}</FormLabel>
                                    <Select
                                        value={form.state.values.textWeight}
                                        onValueChange={(value: typeof form.state.values.textWeight) =>
                                            form.setFieldValue('textWeight', value)
                                        }
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue />
                                            <SelectContent>
                                                {TEXT_WEIGHT_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </SelectTrigger>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{globalize.translate('LabelFont')}</FormLabel>
                                    <Select
                                        value={form.state.values.font}
                                        onValueChange={(value: string) => form.setFieldValue('font', value)}
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue placeholder={globalize.translate('Default')} />
                                            <SelectContent>
                                                {FONT_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </SelectTrigger>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{globalize.translate('LabelTextColor')}</FormLabel>
                                    {layoutManager.tv ? (
                                        <Select
                                            value={form.state.values.textColor}
                                            onValueChange={(value: string) => form.setFieldValue('textColor', value)}
                                        >
                                            <SelectTrigger style={{ width: '100%' }}>
                                                <SelectValue />
                                                <SelectContent>
                                                    {TEXT_COLOR_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </SelectTrigger>
                                        </Select>
                                    ) : (
                                        <Input
                                            type="color"
                                            value={form.state.values.textColor}
                                            onChange={e => form.setFieldValue('textColor', e.target.value)}
                                            style={{ width: '100%', height: '48px', padding: vars.spacing['1'] }}
                                        />
                                    )}
                                </FormControl>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{globalize.translate('LabelDropShadow')}</FormLabel>
                                    <Select
                                        value={form.state.values.dropShadow}
                                        onValueChange={(value: typeof form.state.values.dropShadow) =>
                                            form.setFieldValue('dropShadow', value)
                                        }
                                    >
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue />
                                            <SelectContent>
                                                {DROP_SHADOW_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </SelectTrigger>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <FormLabel>{globalize.translate('LabelSubtitleVerticalPosition')}</FormLabel>
                                    <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                                        <Slider
                                            value={[form.state.values.verticalPosition]}
                                            onValueChange={([val]: number[]) =>
                                                form.setFieldValue('verticalPosition', val)
                                            }
                                            min={-16}
                                            max={16}
                                            step={1}
                                            style={{ flex: 1 }}
                                        />
                                        <Text size="sm" style={{ minWidth: '40px', textAlign: 'right' }}>
                                            {form.state.values.verticalPosition}
                                        </Text>
                                    </Flex>
                                </FormControl>
                                <FormHelperText>{globalize.translate('SubtitleVerticalPositionHelp')}</FormHelperText>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <FormControl>
                                    <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                        <Checkbox checked={false} onChange={() => {}} />
                                        <FormLabel style={{ marginBottom: 0 }}>
                                            {globalize.translate('Preview')}
                                        </FormLabel>
                                    </Flex>
                                </FormControl>
                            </Box>
                        </Box>
                    )}
                </Box>

                <Flex style={{ justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="primary">
                        {globalize.translate('Save')}
                    </Button>
                </Flex>
            </form>
        </Box>
    );
}

export default SubtitleSettings;
