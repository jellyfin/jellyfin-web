import React, { useCallback } from 'react';
import { z } from 'zod';
import { JoyInput, JoyTextarea, JoySwitch, JoySelect } from '../joy-ui/forms';
import { Button } from 'ui-primitives/Button';
import { Divider } from 'ui-primitives/Divider';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

const settingsSchema = z.object({
    appTitle: z.string().min(1, 'App title is required').max(100, 'Title too long'),
    loginDisclaimer: z.string().max(500, 'Disclaimer too long').optional(),
    enableAutomaticUpdates: z.boolean(),
    maxConcurrentStreams: z.number().min(1, 'Must be at least 1').max(20, 'Maximum 20 streams'),
    transcodeH265: z.boolean(),
    enableDts: z.boolean(),
    enableTrueHd: z.boolean(),
    defaultAudioLanguage: z.string().optional(),
    subtitleMode: z.enum(['none', 'all', 'foreign', 'default'])
});

type SettingsData = z.infer<typeof settingsSchema>;

interface FieldState {
    value: string | number | boolean;
    error?: string;
    touched: boolean;
}

interface SettingsFormProps {
    initialValues?: Partial<SettingsData>;
    onSubmit: (values: SettingsData) => Promise<void>;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ initialValues, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState<Record<string, FieldState>>({
        appTitle: { value: 'Jellyfin', touched: false },
        loginDisclaimer: { value: '', touched: false },
        enableAutomaticUpdates: { value: true, touched: false },
        maxConcurrentStreams: { value: 4, touched: false },
        transcodeH265: { value: true, touched: false },
        enableDts: { value: true, touched: false },
        enableTrueHd: { value: true, touched: false },
        defaultAudioLanguage: { value: '', touched: false },
        subtitleMode: { value: 'default', touched: false }
    });

    React.useEffect(() => {
        if (initialValues) {
            setFormData(prev => {
                const updates: Record<string, FieldState> = { ...prev };
                Object.entries(initialValues).forEach(([key, value]) => {
                    if (value !== undefined) {
                        updates[key] = { value, touched: false };
                    }
                });
                return updates;
            });
        }
    }, [initialValues]);

    const validateField = useCallback((name: string, value: unknown): string | undefined => {
        try {
            const schema = settingsSchema.shape[name as keyof typeof settingsSchema.shape];
            if (schema) {
                schema.parse(value);
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                return err.issues[0]?.message;
            }
        }
        return undefined;
    }, []);

    const handleChange = (name: string, newValue: string | number | boolean) => {
        setFormData(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                value: newValue,
                touched: true,
                error: validateField(name, newValue)
            }
        }));
    };

    const handleBlur = (name: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                error: validateField(name, prev[name].value)
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name: string; error: string }[] = [];
        Object.entries(formData).forEach(([name, field]) => {
            const error = validateField(name, field.value);
            if (error) {
                errors.push({ name, error });
            }
        });

        if (errors.length > 0) {
            setFormData(prev => {
                const updates: Record<string, FieldState> = { ...prev };
                errors.forEach(({ name, error }) => {
                    updates[name] = { ...updates[name], error, touched: true };
                });
                return updates;
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const values: SettingsData = {
                appTitle: formData.appTitle.value as string,
                loginDisclaimer: formData.loginDisclaimer.value as string,
                enableAutomaticUpdates: formData.enableAutomaticUpdates.value as boolean,
                maxConcurrentStreams: formData.maxConcurrentStreams.value as number,
                transcodeH265: formData.transcodeH265.value as boolean,
                enableDts: formData.enableDts.value as boolean,
                enableTrueHd: formData.enableTrueHd.value as boolean,
                defaultAudioLanguage: formData.defaultAudioLanguage.value as string,
                subtitleMode: formData.subtitleMode.value as 'none' | 'all' | 'foreign' | 'default'
            };
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            appTitle: { value: 'Jellyfin', touched: false },
            loginDisclaimer: { value: '', touched: false },
            enableAutomaticUpdates: { value: true, touched: false },
            maxConcurrentStreams: { value: 4, touched: false },
            transcodeH265: { value: true, touched: false },
            enableDts: { value: true, touched: false },
            enableTrueHd: { value: true, touched: false },
            defaultAudioLanguage: { value: '', touched: false },
            subtitleMode: { value: 'default', touched: false }
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} style={{ padding: vars.spacing.md }}>
            <Heading.H4 style={{ marginBottom: vars.spacing.lg }}>General Settings</Heading.H4>

            <Flex style={{ flexDirection: 'column', gap: vars.spacing.lg }}>
                <JoyInput
                    label="Application Title"
                    value={String(formData.appTitle.value)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('appTitle', e.target.value)}
                    onBlur={() => handleBlur('appTitle')}
                    error={formData.appTitle.touched ? formData.appTitle.error : undefined}
                />

                <JoyTextarea
                    label="Login Disclaimer"
                    placeholder="Optional message shown on login screen"
                    value={String(formData.loginDisclaimer.value)}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleChange('loginDisclaimer', e.target.value)
                    }
                    onBlur={() => handleBlur('loginDisclaimer')}
                    error={formData.loginDisclaimer.touched ? formData.loginDisclaimer.error : undefined}
                />

                <Divider />

                <Heading.H3>Playback Settings</Heading.H3>

                <JoySwitch
                    label="Enable Automatic Updates"
                    checked={formData.enableAutomaticUpdates.value as boolean}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange('enableAutomaticUpdates', e.target.checked)
                    }
                />

                <JoyInput
                    label="Maximum Concurrent Streams"
                    type="number"
                    value={String(formData.maxConcurrentStreams.value)}
                    min={1}
                    max={20}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange('maxConcurrentStreams', parseInt(e.target.value, 10) || 1)
                    }
                    onBlur={() => handleBlur('maxConcurrentStreams')}
                    error={formData.maxConcurrentStreams.touched ? formData.maxConcurrentStreams.error : undefined}
                />

                <Divider />

                <Heading.H3>Transcoding Settings</Heading.H3>

                <JoySwitch
                    label="Enable H.265 Transcoding"
                    checked={formData.transcodeH265.value as boolean}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange('transcodeH265', e.target.checked)
                    }
                />

                <JoySwitch
                    label="Enable DTS Pass-through"
                    checked={formData.enableDts.value as boolean}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('enableDts', e.target.checked)}
                />

                <JoySwitch
                    label="Enable TrueHD Pass-through"
                    checked={formData.enableTrueHd.value as boolean}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange('enableTrueHd', e.target.checked)
                    }
                />

                <Divider />

                <Heading.H3>Language Settings</Heading.H3>

                <JoyInput
                    label="Default Audio Language"
                    value={String(formData.defaultAudioLanguage.value)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange('defaultAudioLanguage', e.target.value)
                    }
                    placeholder="e.g., eng, spa, fra"
                    helperText="Leave empty for no preference"
                />

                <JoySelect
                    label="Subtitle Mode"
                    value={formData.subtitleMode.value as string}
                    onChange={(_, newValue) => handleChange('subtitleMode', newValue)}
                    options={[
                        { label: 'None', value: 'none' },
                        { label: 'All', value: 'all' },
                        { label: 'Foreign (non-native)', value: 'foreign' },
                        { label: 'Default', value: 'default' }
                    ]}
                />
            </Flex>

            <Flex style={{ marginTop: vars.spacing.xl, gap: vars.spacing.md, justifyContent: 'flex-end' }}>
                <Button variant="outlined" color="neutral" onClick={handleReset} disabled={isSubmitting}>
                    Reset
                </Button>
                <Button type="submit" variant="primary" color="primary" loading={isSubmitting}>
                    Save Settings
                </Button>
            </Flex>
        </Box>
    );
};

export default SettingsForm;
