import type { BaseItemDto, CreateUserByName } from '@jellyfin/sdk/lib/generated-client';
import React, { useCallback, useEffect, useState } from 'react';

import globalize from '../../../../lib/globalize';
import loading from '../../../../components/loading/loading';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import Page from '../../../../components/Page';
import Toast from 'apps/dashboard/components/Toast';

import { useLibraryMediaFolders } from 'apps/dashboard/features/users/api/useLibraryMediaFolders';
import { useChannels } from 'apps/dashboard/features/users/api/useChannels';
import { useUpdateUserPolicy } from 'apps/dashboard/features/users/api/useUpdateUserPolicy';
import { useCreateUser } from 'apps/dashboard/features/users/api/useCreateUser';
import { useNavigate } from 'react-router-dom';
import { logger } from 'utils/logger';

import TextField from '@mui/material/TextField/TextField';
import Button from '@mui/material/Button/Button';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import Switch from '@mui/material/Switch/Switch';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import Divider from '@mui/material/Divider/Divider';
import Checkbox from '@mui/material/Checkbox/Checkbox';
import FormControl from '@mui/material/FormControl/FormControl';
import FormHelperText from '@mui/material/FormHelperText/FormHelperText';
import { z } from 'zod';

type ItemsArr = {
    Name?: string | null;
    Id?: string;
};

const userSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().optional(),
    enableAllFolders: z.boolean(),
    enableAllChannels: z.boolean(),
    enabledFolders: z.array(z.string()),
    enabledChannels: z.array(z.string()),
});

type UserFormData = z.infer<typeof userSchema>;

const UserNew = () => {
    const navigate = useNavigate();
    const [channelsItems, setChannelsItems] = useState<ItemsArr[]>([]);
    const [mediaFoldersItems, setMediaFoldersItems] = useState<ItemsArr[]>([]);
    const [isErrorToastOpen, setIsErrorToastOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        password: '',
        enableAllFolders: false,
        enableAllChannels: false,
        enabledFolders: [],
        enabledChannels: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: mediaFolders, isSuccess: isMediaFoldersSuccess } = useLibraryMediaFolders();
    const { data: channels, isSuccess: isChannelsSuccess } = useChannels();

    const createUser = useCreateUser();
    const updateUserPolicy = useUpdateUserPolicy();

    const handleToastClose = useCallback(() => {
        setIsErrorToastOpen(false);
    }, []);

    useEffect(() => {
        if (isMediaFoldersSuccess && mediaFolders?.Items) {
            setMediaFoldersItems(mediaFolders.Items.map(item => ({
                Id: item.Id,
                Name: item.Name
            })));
        }
    }, [isMediaFoldersSuccess, mediaFolders]);

    useEffect(() => {
        if (isChannelsSuccess && channels?.Items) {
            setChannelsItems(channels.Items.map(item => ({
                Id: item.Id,
                Name: item.Name
            })));
        }
    }, [isChannelsSuccess, channels]);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        loading.show();

        if (!validateForm()) {
            loading.hide();
            return;
        }

        setIsSubmitting(true);

        try {
            const userInput: CreateUserByName = {
                Name: formData.username,
                Password: formData.password || undefined
            };

            const userResponse = await createUser.mutateAsync({ createUserByName: userInput });
            const user = userResponse.data;

            if (!user.Id || !user.Policy) {
                throw new Error('Unexpected null user id or policy');
            }

            const updatedPolicy = {
                ...user.Policy,
                EnableAllFolders: formData.enableAllFolders,
                EnabledFolders: formData.enableAllFolders ? [] : formData.enabledFolders,
                EnableAllChannels: formData.enableAllChannels,
                EnabledChannels: formData.enableAllChannels ? [] : formData.enabledChannels,
            };

            await updateUserPolicy.mutateAsync({
                userId: user.Id,
                userPolicy: updatedPolicy
            });

            navigate(`/dashboard/users/profile?userId=${user.Id}`);
        } catch (error) {
            logger.error('[usernew] failed to create user', { component: 'UserNew' }, error as Error);
            setIsErrorToastOpen(true);
        } finally {
            setIsSubmitting(false);
            loading.hide();
        }
    };

    const handleCancel = () => {
        window.history.back();
    };

    const handleFolderToggle = (folderId: string) => {
        setFormData(prev => ({
            ...prev,
            enabledFolders: prev.enabledFolders.includes(folderId)
                ? prev.enabledFolders.filter(id => id !== folderId)
                : [...prev.enabledFolders, folderId]
        }));
    };

    const handleChannelToggle = (channelId: string) => {
        setFormData(prev => ({
            ...prev,
            enabledChannels: prev.enabledChannels.includes(channelId)
                ? prev.enabledChannels.filter(id => id !== channelId)
                : [...prev.enabledChannels, channelId]
        }));
    };

    return (
        <Page
            id='newUserPage'
            className='mainAnimatedPage type-interior'
        >
            <Toast
                open={isErrorToastOpen}
                onClose={handleToastClose}
                message={globalize.translate('ErrorDefault')}
            />
            <Box className='content-primary' sx={{ p: 3 }}>
                <Box className='verticalSection' sx={{ mb: 3 }}>
                    <Typography variant='h4' component='h1'>
                        {globalize.translate('HeaderAddUser')}
                    </Typography>
                </Box>

                <Box component='form' onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label={globalize.translate('LabelName')}
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            onBlur={() => {
                                if (!formData.username.trim()) {
                                    setErrors(prev => ({ ...prev, username: 'Username is required' }));
                                } else {
                                    setErrors(prev => ({ ...prev, username: '' }));
                                }
                            }}
                            error={!!errors.username}
                            helperText={errors.username}
                            required
                            fullWidth
                            disabled={isSubmitting}
                        />

                        <TextField
                            type='password'
                            label={globalize.translate('LabelPassword')}
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            fullWidth
                            disabled={isSubmitting}
                        />

                        <Divider sx={{ my: 1 }} />

                        <Typography variant='h6'>
                            {globalize.translate('HeaderLibraryAccess')}
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.enableAllFolders}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        enableAllFolders: e.target.checked,
                                        enabledFolders: e.target.checked ? [] : prev.enabledFolders
                                    }))}
                                />
                            }
                            label={globalize.translate('OptionEnableAccessToAllLibraries')}
                        />

                        {!formData.enableAllFolders && (
                            <Box sx={{ ml: 2 }}>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                                    {globalize.translate('HeaderLibraries')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {mediaFoldersItems.map(Item => (
                                        <FormControlLabel
                                            key={Item.Id}
                                            control={
                                                <Checkbox
                                                    checked={formData.enabledFolders.includes(Item.Id || '')}
                                                    onChange={() => Item.Id && handleFolderToggle(Item.Id)}
                                                />
                                            }
                                            label={Item.Name}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Divider sx={{ my: 1 }} />

                        <Typography variant='h6'>
                            {globalize.translate('HeaderChannelAccess')}
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.enableAllChannels}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        enableAllChannels: e.target.checked,
                                        enabledChannels: e.target.checked ? [] : prev.enabledChannels
                                    }))}
                                />
                            }
                            label={globalize.translate('OptionEnableAccessToAllChannels')}
                        />

                        {!formData.enableAllChannels && (
                            <Box sx={{ ml: 2 }}>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                                    {globalize.translate('Channels')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {channelsItems.map(Item => (
                                        <FormControlLabel
                                            key={Item.Id}
                                            control={
                                                <Checkbox
                                                    checked={formData.enabledChannels.includes(Item.Id || '')}
                                                    onChange={() => Item.Id && handleChannelToggle(Item.Id)}
                                                />
                                            }
                                            label={Item.Name}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <Button
                                type='submit'
                                variant='contained'
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? globalize.translate('Loading') + '...' : globalize.translate('Save')}
                            </Button>
                            <Button
                                type='button'
                                variant='outlined'
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                {globalize.translate('ButtonCancel')}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Page>
    );
};

export default UserNew;
