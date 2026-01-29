import type { UserConfiguration } from '@jellyfin/sdk/lib/generated-client';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Slider,
    Text
} from 'ui-primitives';
import { logger } from 'utils/logger';

interface SubtitleAppearanceSettings {
    subtitleStyling?: string;
    textSize?: string;
    textWeight?: string;
    dropShadow?: string;
    font?: string;
    textBackground?: string;
    textColor?: string;
    verticalPosition?: number;
}

interface SubtitleSettingsProps {
    userId: string;
    serverId: string;
    userSettings: {
        getSubtitleAppearanceSettings: (key: string) => SubtitleAppearanceSettings;
        setSubtitleAppearanceSettings: (settings: SubtitleAppearanceSettings, key: string) => void;
        setUserInfo: (userId: string, apiClient: unknown) => Promise<void>;
    };
    appearanceKey?: string;
    onSave?: () => void;
}

import type { SubtitlePlaybackMode } from '@jellyfin/sdk/lib/generated-client';

interface User {
    Id: string;
    Configuration: {
        SubtitleLanguagePreference: string;
        SubtitleMode: SubtitlePlaybackMode;
    };
    Policy: {
        EnableVideoPlaybackTranscoding: boolean;
    };
}

interface Culture {
    Name: string;
    DisplayName: string;
    ThreeLetterISOLanguageName: string;
}

interface SubtitleSettingsState {
    subtitleLanguage: string;
    subtitleMode: string;
    subtitleBurnIn: string;
    renderPgs: boolean;
    alwaysBurnInWhenTranscoding: boolean;
    subtitleStyling: string;
    textSize: string;
    textWeight: string;
    dropShadow: string;
    font: string;
    textBackground: string;
    textColor: string;
    verticalPosition: number;
    previewEnabled: boolean;
    cultures: Culture[];
    user: User | null;
    loading: boolean;
}

const SUBTITLE_MODE_OPTIONS = [
    { value: 'Default', label: 'Default' },
    { value: 'Smart', label: 'Smart' },
    { value: 'OnlyForced', label: 'OnlyForcedSubtitles' },
    { value: 'Always', label: 'AlwaysPlaySubtitles' },
    { value: 'None', label: 'None' }
];

const SUBTITLE_BURN_IN_OPTIONS = [
    { value: '', label: 'Auto' },
    { value: 'onlyimageformats', label: 'OnlyImageFormats' },
    { value: 'allcomplexformats', label: 'AllComplexFormats' },
    { value: 'all', label: 'All' }
];

const TEXT_SIZE_OPTIONS = [
    { value: 'smaller', label: 'Smaller' },
    { value: 'small', label: 'Small' },
    { value: '', label: 'Normal' },
    { value: 'large', label: 'Large' },
    { value: 'larger', label: 'Larger' },
    { value: 'extralarge', label: 'ExtraLarge' }
];

const TEXT_WEIGHT_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' }
];

const FONT_OPTIONS = [
    { value: '', label: 'Default' },
    { value: 'typewriter', label: 'Typewriter' },
    { value: 'print', label: 'Print' },
    { value: 'console', label: 'Console' },
    { value: 'cursive', label: 'Cursive' },
    { value: 'casual', label: 'Casual' },
    { value: 'smallcaps', label: 'SmallCaps' }
];

const DROP_SHADOW_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'raised', label: 'Raised' },
    { value: 'depressed', label: 'Depressed' },
    { value: 'uniform', label: 'Uniform' },
    { value: '', label: 'DropShadow' }
];

const TEXT_COLOR_OPTIONS = [
    { value: '#ffffff', label: 'White' },
    { value: '#d3d3d3', label: 'LightGray' },
    { value: '#808080', label: 'Gray' },
    { value: '#ffff00', label: 'Yellow' },
    { value: '#008000', label: 'Green' },
    { value: '#00ffff', label: 'Cyan' },
    { value: '#0000ff', label: 'Blue' },
    { value: '#ff00ff', label: 'Magenta' },
    { value: '#ff0000', label: 'Red' },
    { value: '#000000', label: 'Black' }
];

function getPreviewStyles(settings: Partial<SubtitleSettingsState>): React.CSSProperties {
    const styles: React.CSSProperties = {};

    switch (settings.textSize) {
        case 'smaller':
            styles.fontSize = '0.8em';
            break;
        case 'small':
            styles.fontSize = 'inherit';
            break;
        case 'larger':
            styles.fontSize = '2em';
            break;
        case 'extralarge':
            styles.fontSize = '2.2em';
            break;
        case 'large':
            styles.fontSize = '1.72em';
            break;
        default:
            styles.fontSize = '1.36em';
            break;
    }

    switch (settings.textWeight) {
        case 'bold':
            styles.fontWeight = 'bold';
            break;
        default:
            styles.fontWeight = 'normal';
            break;
    }

    switch (settings.dropShadow) {
        case 'raised':
            styles.textShadow =
                '-0.04em -0.04em #fff, 0px -0.04em #fff, -0.04em 0px #fff, 0.04em 0.04em #000, 0px 0.04em #000, 0.04em 0px #000';
            break;
        case 'depressed':
            styles.textShadow =
                '0.04em 0.04em #fff, 0px 0.04em #fff, 0.04em 0px #fff, -0.04em -0.04em #000, 0px -0.04em #000, -0.04em 0px #000';
            break;
        case 'uniform':
            styles.textShadow =
                '#000 0px 0.03em, #000 0px -0.03em, #000 0px 0.05em, #000 0px -0.05em, #000 0.03em 0px, #000 -0.03em 0px, #000 0.03em 0.03em, #000 -0.03em 0.03em, #000 0.03em -0.03em, #000 -0.03em -0.03em';
            break;
        case 'none':
            styles.textShadow = 'none';
            break;
        default:
            styles.textShadow = '#000000 0px 0px 7px';
            break;
    }

    styles.backgroundColor = settings.textBackground || 'transparent';
    styles.color = settings.textColor || '#ffffff';

    switch (settings.font) {
        case 'typewriter':
            styles.fontFamily = '"Courier New",monospace';
            break;
        case 'print':
            styles.fontFamily = 'Georgia,Times New Roman,Arial,Helvetica,serif';
            break;
        case 'console':
            styles.fontFamily = 'Consolas,Lucida Console,Menlo,Monaco,monospace';
            break;
        case 'cursive':
            styles.fontFamily = 'Lucida Handwriting,Brush Script MT,Segoe Script,cursive';
            break;
        case 'casual':
            styles.fontFamily = 'Gabriola,Segoe Print,Comic Sans MS,Chalkboard';
            break;
        case 'smallcaps':
            styles.fontFamily = 'Copperplate Gothic,Copperplate';
            styles.fontVariant = 'small-caps';
            break;
        default:
            styles.fontFamily = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
            break;
    }

    return styles;
}

export const SubtitleSettings: React.FC<SubtitleSettingsProps> = ({
    userId,
    serverId,
    userSettings,
    appearanceKey = 'default',
    onSave
}) => {
    const [state, setState] = useState<SubtitleSettingsState>({
        subtitleLanguage: '',
        subtitleMode: 'Default',
        subtitleBurnIn: '',
        renderPgs: false,
        alwaysBurnInWhenTranscoding: false,
        subtitleStyling: 'Auto',
        textSize: '',
        textWeight: 'normal',
        dropShadow: '',
        font: '',
        textBackground: 'transparent',
        textColor: '#ffffff',
        verticalPosition: 0,
        previewEnabled: false,
        cultures: [],
        user: null,
        loading: true
    });

    const loadData = useCallback(async () => {
        try {
            const apiClient = ServerConnections.getApiClient(serverId);
            await userSettings.setUserInfo(userId, apiClient);

            const user = (await apiClient.getUser(userId)) as User;
            const appearanceSettings = userSettings.getSubtitleAppearanceSettings(appearanceKey);
            const cultures = (await apiClient.getCultures()) as Culture[];

            setState((prev) => ({
                ...prev,
                user,
                cultures,
                subtitleLanguage: user.Configuration.SubtitleLanguagePreference || '',
                subtitleMode: user.Configuration.SubtitleMode || 'Default',
                subtitleStyling: appearanceSettings.subtitleStyling || 'Auto',
                textSize: appearanceSettings.textSize || '',
                textWeight: appearanceSettings.textWeight || 'normal',
                dropShadow: appearanceSettings.dropShadow || '',
                font: appearanceSettings.font || '',
                textBackground: appearanceSettings.textBackground || 'transparent',
                textColor: appearanceSettings.textColor || '#ffffff',
                verticalPosition: appearanceSettings.verticalPosition || 0,
                loading: false
            }));
        } catch (error) {
            logger.error('Failed to load subtitle settings', {
                component: 'SubtitleSettings',
                error
            });
            setState((prev) => ({ ...prev, loading: false }));
        }
    }, [userId, serverId, userSettings, appearanceKey]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, loading: true }));

            const apiClient = ServerConnections.getApiClient(serverId);

            const appearanceSettings: SubtitleAppearanceSettings = {
                subtitleStyling: state.subtitleStyling,
                textSize: state.textSize,
                textWeight: state.textWeight,
                dropShadow: state.dropShadow,
                font: state.font,
                textBackground: state.textBackground,
                textColor: state.textColor,
                verticalPosition: state.verticalPosition
            };

            userSettings.setSubtitleAppearanceSettings(appearanceSettings, appearanceKey);

            if (state.user) {
                state.user.Configuration.SubtitleLanguagePreference = state.subtitleLanguage;
                state.user.Configuration.SubtitleMode = state.subtitleMode as SubtitlePlaybackMode;

                await apiClient.updateUserConfiguration(
                    state.user.Id,
                    state.user.Configuration as UserConfiguration
                );
            }

            logger.info('Subtitle settings saved', { component: 'SubtitleSettings' });
            onSave?.();
        } catch (error) {
            logger.error('Failed to save subtitle settings', {
                component: 'SubtitleSettings',
                error
            });
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    }, [state, userSettings, serverId, appearanceKey, onSave]);

    const previewStyles = useMemo(() => {
        return getPreviewStyles({
            textSize: state.textSize,
            textWeight: state.textWeight,
            dropShadow: state.dropShadow,
            font: state.font,
            textBackground: state.textBackground,
            textColor: state.textColor
        });
    }, [
        state.textSize,
        state.textWeight,
        state.dropShadow,
        state.font,
        state.textBackground,
        state.textColor
    ]);

    const showBurnInOptions = state.user?.Policy.EnableVideoPlaybackTranscoding;

    const handleTextColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState((prev) => ({ ...prev, textColor: event.target.value }));
    };

    const handleTextBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState((prev) => ({ ...prev, textBackground: event.target.value }));
    };

    const handleVerticalPositionChange = (value: number[]) => {
        setState((prev) => ({ ...prev, verticalPosition: value[0] ?? 0 }));
    };

    if (state.loading && !state.user) {
        return (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: vars.spacing['6'] }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box style={{ maxWidth: 600, margin: '0 auto', padding: vars.spacing['5'] }}>
            <Text as="h2" size="xl" weight="bold" style={{ marginBottom: vars.spacing['6'] }}>
                {globalize.translate('Subtitles')}
            </Text>

            <Flex style={{ flexDirection: 'column', gap: vars.spacing['6'] }}>
                <FormControl>
                    <FormLabel>{globalize.translate('LabelPreferredSubtitleLanguage')}</FormLabel>
                    <Select
                        value={state.subtitleLanguage}
                        onValueChange={(value) =>
                            setState((prev) => ({ ...prev, subtitleLanguage: value }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={globalize.translate('Default')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{globalize.translate('Default')}</SelectItem>
                            {state.cultures.map((culture) => (
                                <SelectItem
                                    key={culture.ThreeLetterISOLanguageName}
                                    value={culture.ThreeLetterISOLanguageName}
                                >
                                    {culture.DisplayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>{globalize.translate('LabelSubtitlePlaybackMode')}</FormLabel>
                    <Select
                        value={state.subtitleMode}
                        onValueChange={(value) =>
                            setState((prev) => ({ ...prev, subtitleMode: value || 'Default' }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SUBTITLE_MODE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {globalize.translate(option.label)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormControl>

                {showBurnInOptions && (
                    <FormControl>
                        <FormLabel>{globalize.translate('LabelBurnSubtitles')}</FormLabel>
                        <Select
                            value={state.subtitleBurnIn}
                            onValueChange={(value) =>
                                setState((prev) => ({ ...prev, subtitleBurnIn: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SUBTITLE_BURN_IN_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {globalize.translate(option.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Text size="xs" color="secondary" style={{ marginTop: vars.spacing['2'] }}>
                            {globalize.translate('BurnSubtitlesHelp')}
                        </Text>
                    </FormControl>
                )}

                <FormControl>
                    <Checkbox
                        checked={state.alwaysBurnInWhenTranscoding}
                        onChangeChecked={(checked) =>
                            setState((prev) => ({ ...prev, alwaysBurnInWhenTranscoding: checked }))
                        }
                    >
                        {globalize.translate('AlwaysBurnInSubtitleWhenTranscoding')}
                    </Checkbox>
                </FormControl>

                <>
                    <Divider />

                    <Text as="h3" size="lg" weight="bold">
                        {globalize.translate('HeaderSubtitleAppearance')}
                    </Text>

                    <Box
                        style={{
                            padding: vars.spacing['6'],
                            background: 'linear-gradient(140deg, #aa5cc3, #00a4dc)',
                            borderRadius: vars.borderRadius.md,
                            textAlign: 'center'
                        }}
                    >
                        <Box
                            style={{
                                width: '90%',
                                margin: '0 auto',
                                padding: vars.spacing['4'],
                                backgroundColor: state.textBackground || 'transparent',
                                color: state.textColor || '#ffffff',
                                ...previewStyles
                            }}
                        >
                            {globalize.translate('TheseSettingsAffectSubtitlesOnThisDevice')}
                        </Box>
                    </Box>

                    <Text size="sm" color="secondary">
                        {globalize.translate('SubtitleAppearanceSettingsDisclaimer')}
                    </Text>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelSubtitleStyling')}</FormLabel>
                        <Select
                            value={state.subtitleStyling}
                            onValueChange={(value) =>
                                setState((prev) => ({ ...prev, subtitleStyling: value || 'Auto' }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Auto">{globalize.translate('Auto')}</SelectItem>
                                <SelectItem value="Custom">
                                    {globalize.translate('Custom')}
                                </SelectItem>
                                <SelectItem value="Native">
                                    {globalize.translate('Native')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextSize')}</FormLabel>
                        <Select
                            value={state.textSize}
                            onValueChange={(value) =>
                                setState((prev) => ({ ...prev, textSize: value || '' }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TEXT_SIZE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {globalize.translate(option.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextWeight')}</FormLabel>
                        <Select
                            value={state.textWeight}
                            onValueChange={(value) =>
                                setState((prev) => ({ ...prev, textWeight: value || 'normal' }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TEXT_WEIGHT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {globalize.translate(option.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelFont')}</FormLabel>
                        <Select
                            value={state.font}
                            onValueChange={(value) =>
                                setState((prev) => ({ ...prev, font: value || '' }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FONT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {globalize.translate(option.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextColor')}</FormLabel>
                        <Flex style={{ gap: vars.spacing['4'], flexWrap: 'wrap' }}>
                            {TEXT_COLOR_OPTIONS.map((option) => (
                                <Box
                                    key={option.value}
                                    onClick={() =>
                                        setState((prev) => ({ ...prev, textColor: option.value }))
                                    }
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: option.value,
                                        border:
                                            state.textColor === option.value
                                                ? '2px solid #fff'
                                                : '2px solid transparent',
                                        cursor: 'pointer',
                                        boxShadow:
                                            state.textColor === option.value
                                                ? '0 0 0 2px #000'
                                                : 'none'
                                    }}
                                />
                            ))}
                        </Flex>
                        <Input
                            type="text"
                            value={state.textColor}
                            onChange={handleTextColorChange}
                            style={{ marginTop: vars.spacing['4'] }}
                            placeholder="#ffffff"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextBackgroundColor')}</FormLabel>
                        <Input
                            type="text"
                            value={state.textBackground}
                            onChange={handleTextBackgroundChange}
                            placeholder="transparent"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelDropShadow')}</FormLabel>
                        <Select
                            value={state.dropShadow}
                            onValueChange={(value) =>
                                setState((prev) => ({ ...prev, dropShadow: value || '' }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DROP_SHADOW_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {globalize.translate(option.label)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>
                            {globalize.translate('LabelSubtitleVerticalPosition')}
                        </FormLabel>
                        <Slider
                            value={[state.verticalPosition]}
                            onValueChange={handleVerticalPositionChange}
                            min={-16}
                            max={16}
                            step={1}
                        />
                        <Text size="xs" color="secondary" style={{ marginTop: vars.spacing['2'] }}>
                            {globalize.translate('SubtitleVerticalPositionHelp')}
                        </Text>
                    </FormControl>

                    <FormControl>
                        <Checkbox
                            checked={state.previewEnabled}
                            onChangeChecked={(checked) =>
                                setState((prev) => ({ ...prev, previewEnabled: checked }))
                            }
                        >
                            {globalize.translate('Preview')}
                        </Checkbox>
                    </FormControl>
                </>

                <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={state.loading}
                    style={{ marginTop: vars.spacing['5'] }}
                >
                    {globalize.translate('Save')}
                </Button>
            </Flex>
        </Box>
    );
};

export default SubtitleSettings;
