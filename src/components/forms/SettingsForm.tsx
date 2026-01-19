import React, { useCallback } from 'react';
import { z } from 'zod';
import Box from '@mui/material/Box/Box';
import TextField from '@mui/material/TextField/TextField';
import Button from '@mui/material/Button/Button';
import Switch from '@mui/material/Switch/Switch';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import Typography from '@mui/material/Typography/Typography';
import Divider from '@mui/material/Divider/Divider';

const settingsSchema = z.object({
    appTitle: z.string().min(1, 'App title is required').max(100, 'Title too long'),
    loginDisclaimer: z.string().max(500, 'Disclaimer too long').optional(),
    enableAutomaticUpdates: z.boolean(),
    maxConcurrentStreams: z.number().min(1, 'Must be at least 1').max(20, 'Maximum 20 streams'),
    transcodeH265: z.boolean(),
    enableDts: z.boolean(),
    enableTrueHd: z.boolean(),
    defaultAudioLanguage: z.string().optional(),
    subtitleMode: z.enum(['none', 'all', 'foreign', 'default']),
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

export const SettingsForm: React.FC<SettingsFormProps> = ({
    initialValues,
    onSubmit
}) => {
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
        subtitleMode: { value: 'default', touched: false },
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
                const error = err as unknown as { issues: Array<{ message: string }> };
                return error.issues[0]?.message;
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
                subtitleMode: formData.subtitleMode.value as 'none' | 'all' | 'foreign' | 'default',
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
            subtitleMode: { value: 'default', touched: false },
        });
    };

    return (
        <Box component='form' onSubmit={handleSubmit}>
            <Typography variant='h6' sx={{ mb: 2 }}>
                General Settings
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                    label='Application Title'
                    value={formData.appTitle.value}
                    onChange={(e) => handleChange('appTitle', e.target.value)}
                    onBlur={() => handleBlur('appTitle')}
                    error={formData.appTitle.touched && !!formData.appTitle.error}
                    helperText={formData.appTitle.touched ? formData.appTitle.error : undefined}
                    fullWidth
                />

                <TextField
                    label='Login Disclaimer'
                    value={formData.loginDisclaimer.value}
                    onChange={(e) => handleChange('loginDisclaimer', e.target.value)}
                    onBlur={() => handleBlur('loginDisclaimer')}
                    error={formData.loginDisclaimer.touched && !!formData.loginDisclaimer.error}
                    helperText={formData.loginDisclaimer.touched ? formData.loginDisclaimer.error : 'Optional message shown on login screen'}
                    multiline
                    rows={3}
                    fullWidth
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant='h6' sx={{ mb: 1 }}>
                    Playback Settings
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.enableAutomaticUpdates.value as boolean}
                            onChange={(e) => handleChange('enableAutomaticUpdates', e.target.checked)}
                        />
                    }
                    label='Enable Automatic Updates'
                />

                <TextField
                    label='Maximum Concurrent Streams'
                    type='number'
                    value={formData.maxConcurrentStreams.value}
                    onChange={(e) => handleChange('maxConcurrentStreams', parseInt(e.target.value, 10) || 1)}
                    onBlur={() => handleBlur('maxConcurrentStreams')}
                    error={formData.maxConcurrentStreams.touched && !!formData.maxConcurrentStreams.error}
                    helperText={formData.maxConcurrentStreams.touched ? formData.maxConcurrentStreams.error : undefined}
                    inputProps={{ min: 1, max: 20 }}
                    fullWidth
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant='h6' sx={{ mb: 1 }}>
                    Transcoding Settings
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.transcodeH265.value as boolean}
                            onChange={(e) => handleChange('transcodeH265', e.target.checked)}
                        />
                    }
                    label='Enable H.265 Transcoding'
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.enableDts.value as boolean}
                            onChange={(e) => handleChange('enableDts', e.target.checked)}
                        />
                    }
                    label='Enable DTS Pass-through'
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.enableTrueHd.value as boolean}
                            onChange={(e) => handleChange('enableTrueHd', e.target.checked)}
                        />
                    }
                    label='Enable TrueHD Pass-through'
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant='h6' sx={{ mb: 1 }}>
                    Language Settings
                </Typography>

                <TextField
                    label='Default Audio Language'
                    value={formData.defaultAudioLanguage.value}
                    onChange={(e) => handleChange('defaultAudioLanguage', e.target.value)}
                    placeholder='e.g., eng, spa, fra'
                    helperText='Leave empty for no preference'
                    fullWidth
                />

                <TextField
                    select
                    label='Subtitle Mode'
                    value={formData.subtitleMode.value}
                    onChange={(e) => handleChange('subtitleMode', e.target.value)}
                    SelectProps={{ native: true }}
                    fullWidth
                >
                    <option value='none'>None</option>
                    <option value='all'>All</option>
                    <option value='foreign'>Foreign (non-native)</option>
                    <option value='default'>Default</option>
                </TextField>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                    variant='outlined'
                    onClick={handleReset}
                    disabled={isSubmitting}
                >
                    Reset
                </Button>
                <Button
                    type='submit'
                    variant='contained'
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
            </Box>
        </Box>
    );
};

export default SettingsForm;
