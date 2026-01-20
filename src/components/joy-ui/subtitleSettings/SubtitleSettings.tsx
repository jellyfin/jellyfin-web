import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Checkbox from '@mui/joy/Checkbox';
import Divider from '@mui/joy/Divider';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import Slider from '@mui/joy/Slider';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
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

interface User {
    Id: string;
    Configuration: {
        SubtitleLanguagePreference: string;
        SubtitleMode: string;
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
            styles.textShadow = '-0.04em -0.04em #fff, 0px -0.04em #fff, -0.04em 0px #fff, 0.04em 0.04em #000, 0px 0.04em #000, 0.04em 0px #000';
            break;
        case 'depressed':
            styles.textShadow = '0.04em 0.04em #fff, 0px 0.04em #fff, 0.04em 0px #fff, -0.04em -0.04em #000, 0px -0.04em #000, -0.04em 0px #000';
            break;
        case 'uniform':
            styles.textShadow = '#000 0px 0.03em, #000 0px -0.03em, #000 0px 0.05em, #000 0px -0.05em, #000 0.03em 0px, #000 -0.03em 0px, #000 0.03em 0.03em, #000 -0.03em 0.03em, #000 0.03em -0.03em, #000 -0.03em -0.03em';
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

            const user = await apiClient.getUser(userId) as User;
            const appearanceSettings = userSettings.getSubtitleAppearanceSettings(appearanceKey);
            const cultures = await apiClient.getCultures() as Culture[];

            setState(prev => ({
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
            logger.error('Failed to load subtitle settings', { component: 'SubtitleSettings', error });
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [userId, serverId, userSettings, appearanceKey]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true }));

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
                state.user.Configuration.SubtitleMode = state.subtitleMode;

                await apiClient.updateUserConfiguration(state.user.Id, state.user.Configuration);
            }

            logger.info('Subtitle settings saved', { component: 'SubtitleSettings' });
            onSave?.();
        } catch (error) {
            logger.error('Failed to save subtitle settings', { component: 'SubtitleSettings', error });
        } finally {
            setState(prev => ({ ...prev, loading: false }));
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
    }, [state.textSize, state.textWeight, state.dropShadow, state.font, state.textBackground, state.textColor]);

    const showBurnInOptions = state.user?.Policy.EnableVideoPlaybackTranscoding;

    const handleSubtitleModeChange = (_event: unknown, value: string | null) => {
        setState(prev => ({ ...prev, subtitleMode: value || 'Default' }));
    };

    const handleSubtitleStylingChange = (_event: unknown, value: string | null) => {
        setState(prev => ({ ...prev, subtitleStyling: value || 'Auto' }));
    };

    const handleTextSizeChange = (_event: unknown, value: string | null) => {
        setState(prev => ({ ...prev, textSize: value || '' }));
    };

    const handleTextWeightChange = (_event: unknown, value: string | null) => {
        setState(prev => ({ ...prev, textWeight: value || 'normal' }));
    };

    const handleDropShadowChange = (_event: unknown, value: string | null) => {
        setState(prev => ({ ...prev, dropShadow: value || '' }));
    };

    const handleFontChange = (_event: unknown, value: string | null) => {
        setState(prev => ({ ...prev, font: value || '' }));
    };

    const handleTextColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState(prev => ({ ...prev, textColor: event.target.value }));
    };

    const handleTextBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState(prev => ({ ...prev, textBackground: event.target.value }));
    };

    const handleVerticalPositionChange = (_event: Event, value: number | number[]) => {
        setState(prev => ({ ...prev, verticalPosition: value as number }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setState(prev => ({ ...prev, alwaysBurnInWhenTranscoding: checked }));
    };

    const handlePreviewCheckboxChange = (checked: boolean) => {
        setState(prev => ({ ...prev, previewEnabled: checked }));
    };

    if (state.loading && !state.user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
            <Typography level='h2' sx={{ mb: 3 }}>
                {globalize.translate('Subtitles')}
            </Typography>

            <Stack spacing={3}>
                <FormControl>
                    <FormLabel>{globalize.translate('LabelPreferredSubtitleLanguage')}</FormLabel>
                    <Select
                        value={state.subtitleLanguage}
                        onChange={(_event, value) => setState(prev => ({ ...prev, subtitleLanguage: value || '' }))}
                    >
                        <Option value=''>{globalize.translate('Default')}</Option>
                        {state.cultures.map(culture => (
                            <Option key={culture.ThreeLetterISOLanguageName} value={culture.ThreeLetterISOLanguageName}>
                                {culture.DisplayName}
                            </Option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>{globalize.translate('LabelSubtitlePlaybackMode')}</FormLabel>
                    <Select
                        value={state.subtitleMode}
                        onChange={handleSubtitleModeChange}
                    >
                        {SUBTITLE_MODE_OPTIONS.map(option => (
                            <Option key={option.value} value={option.value}>{globalize.translate(option.label)}</Option>
                        ))}
                    </Select>
                </FormControl>

                {showBurnInOptions && (
                    <FormControl>
                        <FormLabel>{globalize.translate('LabelBurnSubtitles')}</FormLabel>
                        <Select
                            value={state.subtitleBurnIn}
                            onChange={(_event, value) => setState(prev => ({ ...prev, subtitleBurnIn: value || '' }))}
                        >
                            {SUBTITLE_BURN_IN_OPTIONS.map(option => (
                                <Option key={option.value} value={option.value}>{globalize.translate(option.label)}</Option>
                            ))}
                        </Select>
                        <Typography level='body-xs' sx={{ mt: 1 }}>
                            {globalize.translate('BurnSubtitlesHelp')}
                        </Typography>
                    </FormControl>
                )}

                <FormControl>
                    <Checkbox
                        label={globalize.translate('AlwaysBurnInSubtitleWhenTranscoding')}
                        checked={state.alwaysBurnInWhenTranscoding}
                        onChange={() => handleCheckboxChange(state.alwaysBurnInWhenTranscoding ? false : true)}
                    />
                </FormControl>

                <>
                    <Divider sx={{ my: 2 }} />

                    <Typography level='h3'>
                        {globalize.translate('HeaderSubtitleAppearance')}
                    </Typography>

                    <Box sx={{
                        p: 3,
                        background: 'linear-gradient(140deg, #aa5cc3, #00a4dc)',
                        borderRadius: 'md',
                        textAlign: 'center'
                    }}>
                        <Box sx={{
                            width: '90%',
                            mx: 'auto',
                            p: 1,
                            backgroundColor: state.textBackground || 'transparent',
                            color: state.textColor || '#ffffff',
                            ...previewStyles
                        }}>
                            {globalize.translate('TheseSettingsAffectSubtitlesOnThisDevice')}
                        </Box>
                    </Box>

                    <Typography level='body-sm'>
                        {globalize.translate('SubtitleAppearanceSettingsDisclaimer')}
                    </Typography>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelSubtitleStyling')}</FormLabel>
                        <Select
                            value={state.subtitleStyling}
                            onChange={handleSubtitleStylingChange}
                        >
                            <Option value='Auto'>{globalize.translate('Auto')}</Option>
                            <Option value='Custom'>{globalize.translate('Custom')}</Option>
                            <Option value='Native'>{globalize.translate('Native')}</Option>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextSize')}</FormLabel>
                        <Select
                            value={state.textSize}
                            onChange={handleTextSizeChange}
                        >
                            {TEXT_SIZE_OPTIONS.map(option => (
                                <Option key={option.value} value={option.value}>{globalize.translate(option.label)}</Option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextWeight')}</FormLabel>
                        <Select
                            value={state.textWeight}
                            onChange={handleTextWeightChange}
                        >
                            {TEXT_WEIGHT_OPTIONS.map(option => (
                                <Option key={option.value} value={option.value}>{globalize.translate(option.label)}</Option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelFont')}</FormLabel>
                        <Select
                            value={state.font}
                            onChange={handleFontChange}
                        >
                            {FONT_OPTIONS.map(option => (
                                <Option key={option.value} value={option.value}>{globalize.translate(option.label)}</Option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextColor')}</FormLabel>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {TEXT_COLOR_OPTIONS.map(option => (
                                <Box
                                    key={option.value}
                                    onClick={() => setState(prev => ({ ...prev, textColor: option.value }))}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: option.value,
                                        border: state.textColor === option.value ? '2px solid #fff' : '2px solid transparent',
                                        cursor: 'pointer',
                                        boxShadow: state.textColor === option.value ? '0 0 0 2px #000' : 'none'
                                    }}
                                />
                            ))}
                        </Box>
                        <Input
                            type='text'
                            value={state.textColor}
                            onChange={handleTextColorChange}
                            sx={{ mt: 1 }}
                            placeholder='#ffffff'
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelTextBackgroundColor')}</FormLabel>
                        <Input
                            type='text'
                            value={state.textBackground}
                            onChange={handleTextBackgroundChange}
                            placeholder='transparent'
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelDropShadow')}</FormLabel>
                        <Select
                            value={state.dropShadow}
                            onChange={handleDropShadowChange}
                        >
                            {DROP_SHADOW_OPTIONS.map(option => (
                                <Option key={option.value} value={option.value}>{globalize.translate(option.label)}</Option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{globalize.translate('LabelSubtitleVerticalPosition')}</FormLabel>
                        <Slider
                            value={state.verticalPosition}
                            onChange={handleVerticalPositionChange}
                            min={-16}
                            max={16}
                            step={1}
                            valueLabelDisplay='auto'
                        />
                        <Typography level='body-xs' sx={{ mt: 1 }}>
                            {globalize.translate('SubtitleVerticalPositionHelp')}
                        </Typography>
                    </FormControl>

                    <FormControl>
                        <Checkbox
                            label={globalize.translate('Preview')}
                            checked={state.previewEnabled}
                            onChange={() => handlePreviewCheckboxChange(state.previewEnabled ? false : true)}
                        />
                    </FormControl>
                </>

                <Button
                    variant='solid'
                    color='primary'
                    onClick={handleSave}
                    loading={state.loading}
                    sx={{ mt: 2 }}
                >
                    {globalize.translate('Save')}
                </Button>
            </Stack>
        </Box>
    );
};

export default SubtitleSettings;
