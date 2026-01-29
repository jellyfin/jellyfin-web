import globalize from 'lib/globalize';

import React, { useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Divider,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Text
} from 'ui-primitives';

interface DisplaySettingsData {
    language: string;
    dateTimeLocale: string;
    displayMode: string;
    theme: string;
    disableCustomCss: boolean;
    customCss: string;
    enableBackdrops: boolean;
    enableThemeSongs: boolean;
    enableThemeVideos: boolean;
    maxDaysForNextUp: number;
    enableRewatchingNextUp: boolean;
    useEpisodeImagesInNextUp: boolean;
    enableDetailsBanner: boolean;
}

interface CultureOption {
    value: string;
    label: string;
}

interface DisplaySettingsFormProps {
    cultures: CultureOption[];
    themes: { value: string; label: string }[];
    onSave: (settings: DisplaySettingsData) => Promise<void>;
    onCancel: () => void;
    initialData?: Partial<DisplaySettingsData>;
}

export function DisplaySettingsForm({
    cultures,
    themes,
    onSave,
    onCancel,
    initialData
}: DisplaySettingsFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [formData, setFormData] = useState<DisplaySettingsData>({
        language: initialData?.language ?? '',
        dateTimeLocale: initialData?.dateTimeLocale ?? '',
        displayMode: initialData?.displayMode ?? 'auto',
        theme: initialData?.theme ?? '',
        disableCustomCss: initialData?.disableCustomCss ?? false,
        customCss: initialData?.customCss ?? '',
        enableBackdrops: initialData?.enableBackdrops ?? true,
        enableThemeSongs: initialData?.enableThemeSongs ?? true,
        enableThemeVideos: initialData?.enableThemeVideos ?? true,
        maxDaysForNextUp: initialData?.maxDaysForNextUp ?? 0,
        enableRewatchingNextUp: initialData?.enableRewatchingNextUp ?? false,
        useEpisodeImagesInNextUp: initialData?.useEpisodeImagesInNextUp ?? true,
        enableDetailsBanner: initialData?.enableDetailsBanner ?? true
    });

    const languageOptions = [{ value: '', label: globalize.translate('Auto') }, ...cultures];

    const displayModeOptions = [
        { value: 'auto', label: globalize.translate('Auto') },
        { value: 'desktop', label: globalize.translate('Desktop') },
        { value: 'mobile', label: globalize.translate('Mobile') },
        { value: 'tv', label: globalize.translate('TV') }
    ];

    const handleChange = (field: keyof DisplaySettingsData, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box style={{ maxWidth: '800px', margin: '0 auto', padding: vars.spacing['5'] }}>
            {saveSuccess && (
                <Alert variant="success" style={{ marginBottom: vars.spacing['5'] }}>
                    {globalize.translate('SettingsSaved')}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Box style={{ marginBottom: vars.spacing['6'] }}>
                    <Heading.H3 style={{ marginBottom: vars.spacing['2'] }}>
                        {globalize.translate('Localization')}
                    </Heading.H3>
                    <Text color="secondary" size="sm" style={{ marginBottom: vars.spacing['4'] }}>
                        {globalize.translate('LabelDisplayLanguageHelp')}
                    </Text>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel>{globalize.translate('LabelDisplayLanguage')}</FormLabel>
                            <Select
                                value={formData.language}
                                onValueChange={(value: string) => handleChange('language', value)}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('Auto')} />
                                    <SelectContent>
                                        {languageOptions.map((opt) => (
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
                            <FormLabel>{globalize.translate('LabelDateTimeLocale')}</FormLabel>
                            <Select
                                value={formData.dateTimeLocale}
                                onValueChange={(value: string) =>
                                    handleChange('dateTimeLocale', value)
                                }
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('Auto')} />
                                    <SelectContent>
                                        {languageOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectTrigger>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                <Divider style={{ margin: '24px 0' }} />

                <Box style={{ marginBottom: vars.spacing['6'] }}>
                    <Heading.H3 style={{ marginBottom: vars.spacing['2'] }}>
                        {globalize.translate('Display')}
                    </Heading.H3>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel>{globalize.translate('LabelDisplayMode')}</FormLabel>
                            <Select
                                value={formData.displayMode}
                                onValueChange={(value: string) =>
                                    handleChange('displayMode', value)
                                }
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue />
                                    <SelectContent>
                                        {displayModeOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectTrigger>
                            </Select>
                        </FormControl>
                        <FormHelperText>{globalize.translate('DisplayModeHelp')}</FormHelperText>
                    </Box>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel>{globalize.translate('LabelTheme')}</FormLabel>
                            <Select
                                value={formData.theme}
                                onValueChange={(value: string) => handleChange('theme', value)}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('Auto')} />
                                    <SelectContent>
                                        {themes.map((opt) => (
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
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={formData.disableCustomCss}
                                    onChange={(e) =>
                                        handleChange('disableCustomCss', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('DisableCustomCss')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: '36px' }}>
                                {globalize.translate('LabelDisableCustomCss')}
                            </FormHelperText>
                        </FormControl>
                    </Box>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel>{globalize.translate('LabelCustomCss')}</FormLabel>
                            <Input
                                as="textarea"
                                value={formData.customCss}
                                onChange={(e) => handleChange('customCss', e.target.value)}
                                style={{ minHeight: '100px', fontFamily: 'monospace' }}
                            />
                        </FormControl>
                        <FormHelperText>
                            {globalize.translate('LabelLocalCustomCss')}
                        </FormHelperText>
                    </Box>
                </Box>

                <Divider style={{ margin: '24px 0' }} />

                <Box style={{ marginBottom: vars.spacing['6'] }}>
                    <Heading.H3 style={{ marginBottom: vars.spacing['4'] }}>
                        {globalize.translate('HeaderLibraries')}
                    </Heading.H3>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={formData.enableBackdrops}
                                    onChange={(e) =>
                                        handleChange('enableBackdrops', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('Backdrops')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: '36px' }}>
                                {globalize.translate('EnableBackdropsHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={formData.enableThemeSongs}
                                    onChange={(e) =>
                                        handleChange('enableThemeSongs', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('ThemeSongs')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: '36px' }}>
                                {globalize.translate('EnableThemeSongsHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={formData.enableThemeVideos}
                                    onChange={(e) =>
                                        handleChange('enableThemeVideos', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('ThemeVideos')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: '36px' }}>
                                {globalize.translate('EnableThemeVideosHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>
                </Box>

                <Divider style={{ margin: '24px 0' }} />

                <Box style={{ marginBottom: vars.spacing['6'] }}>
                    <Heading.H3 style={{ marginBottom: vars.spacing['4'] }}>
                        {globalize.translate('NextUp')}
                    </Heading.H3>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel>{globalize.translate('LabelMaxDaysForNextUp')}</FormLabel>
                            <Input
                                type="number"
                                value={formData.maxDaysForNextUp}
                                onChange={(e) =>
                                    handleChange(
                                        'maxDaysForNextUp',
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                                min={0}
                                max={1000}
                            />
                        </FormControl>
                        <FormHelperText>
                            {globalize.translate('LabelMaxDaysForNextUpHelp')}
                        </FormHelperText>
                    </Box>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={formData.enableRewatchingNextUp}
                                    onChange={(e) =>
                                        handleChange('enableRewatchingNextUp', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('EnableRewatchingNextUp')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: '36px' }}>
                                {globalize.translate('EnableRewatchingNextUpHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={formData.useEpisodeImagesInNextUp}
                                    onChange={(e) =>
                                        handleChange('useEpisodeImagesInNextUp', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('UseEpisodeImagesInNextUp')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: '36px' }}>
                                {globalize.translate('UseEpisodeImagesInNextUpHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>
                </Box>

                <Divider style={{ margin: '24px 0' }} />

                <Box style={{ marginBottom: vars.spacing['6'] }}>
                    <Heading.H3 style={{ marginBottom: vars.spacing['4'] }}>
                        {globalize.translate('ItemDetails')}
                    </Heading.H3>

                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                        <FormControl>
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Checkbox
                                    checked={formData.enableDetailsBanner}
                                    onChange={(e) =>
                                        handleChange('enableDetailsBanner', e.target.checked)
                                    }
                                />
                                <FormLabel style={{ marginBottom: 0 }}>
                                    {globalize.translate('EnableDetailsBanner')}
                                </FormLabel>
                            </Flex>
                            <FormHelperText style={{ marginLeft: '36px' }}>
                                {globalize.translate('EnableDetailsBannerHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>
                </Box>

                <Flex style={{ gap: vars.spacing['4'], justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
                        {globalize.translate('ButtonCancel')}
                    </Button>
                    <Button variant="primary" type="submit" loading={isSaving}>
                        {globalize.translate('Save')}
                    </Button>
                </Flex>
            </form>
        </Box>
    );
}

export default DisplaySettingsForm;
