import { vars } from 'styles/tokens.css.ts';

import type { BaseItemDto, CreateUserByName } from '@jellyfin/sdk/lib/generated-client';
import React, { useCallback, useEffect, useState } from 'react';

import globalize from '../../../../lib/globalize';
import loading from '../../../../components/loading/loading';
import Page from '../../../../components/Page';
import Toast from 'apps/dashboard/components/Toast';

import { useLibraryMediaFolders } from 'apps/dashboard/features/users/api/useLibraryMediaFolders';
import { useChannels } from 'apps/dashboard/features/users/api/useChannels';
import { useUpdateUserPolicy } from 'apps/dashboard/features/users/api/useUpdateUserPolicy';
import { useCreateUser } from 'apps/dashboard/features/users/api/useCreateUser';
import { useNavigate } from '@tanstack/react-router';
import { logger } from 'utils/logger';

import { Button } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { FormControl, FormControlLabel } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Divider } from 'ui-primitives';
import { Switch } from 'ui-primitives';
import { z } from 'zod';

interface ItemsArr {
    Name?: string | null;
    Id?: string;
}

const userSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().optional(),
    enableAllFolders: z.boolean(),
    enableAllChannels: z.boolean(),
    enabledFolders: z.array(z.string()),
    enabledChannels: z.array(z.string())
});

type UserFormData = z.infer<typeof userSchema>;

const UserNew = (): React.ReactElement => {
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
        enabledChannels: []
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
            setMediaFoldersItems(
                mediaFolders.Items.map(item => ({
                    Id: item.Id,
                    Name: item.Name
                }))
            );
        }
    }, [isMediaFoldersSuccess, mediaFolders]);

    useEffect(() => {
        if (isChannelsSuccess && channels?.Items) {
            setChannelsItems(
                channels.Items.map(item => ({
                    Id: item.Id,
                    Name: item.Name
                }))
            );
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
                EnabledChannels: formData.enableAllChannels ? [] : formData.enabledChannels
            };

            await updateUserPolicy.mutateAsync({
                userId: user.Id,
                userPolicy: updatedPolicy
            });

            navigate({ to: `/dashboard/users/profile?userId=${user.Id}` });
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
        <Page id="newUserPage" className="mainAnimatedPage type-interior">
            <Toast open={isErrorToastOpen} onClose={handleToastClose} message={globalize.translate('ErrorDefault')} />
            <Flex className="content-primary" style={{ padding: vars.spacing['5'] }}>
                <Flex className="verticalSection" style={{ marginBottom: vars.spacing['5'] }}>
                    <Text as="h1" size="xl" weight="bold">
                        {globalize.translate('HeaderAddUser')}
                    </Text>
                </Flex>

                <form onSubmit={handleSubmit} style={{ maxWidth: '600px', width: '100%' }}>
                    <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                        <Input
                            label={globalize.translate('LabelName')}
                            value={formData.username}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData(prev => ({ ...prev, username: e.target.value }))
                            }
                            onBlur={() => {
                                if (!formData.username.trim()) {
                                    setErrors(prev => ({ ...prev, username: 'Username is required' }));
                                } else {
                                    setErrors(prev => ({ ...prev, username: '' }));
                                }
                            }}
                            helperText={errors.username}
                            required
                            disabled={isSubmitting}
                        />

                        <Input
                            type="password"
                            label={globalize.translate('LabelPassword')}
                            value={formData.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData(prev => ({ ...prev, password: e.target.value }))
                            }
                            disabled={isSubmitting}
                        />

                        <Divider />

                        <Text as="h2" size="lg" weight="bold">
                            {globalize.translate('HeaderLibraryAccess')}
                        </Text>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.enableAllFolders}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            enableAllFolders: e.target.checked,
                                            enabledFolders: e.target.checked ? [] : prev.enabledFolders
                                        }))
                                    }
                                />
                            }
                            label={globalize.translate('OptionEnableAccessToAllLibraries')}
                        />

                        {!formData.enableAllFolders && (
                            <Flex style={{ marginLeft: '16px', flexDirection: 'column', gap: vars.spacing['2'] }}>
                                <Text as="span" size="sm" color="secondary">
                                    {globalize.translate('HeaderLibraries')}
                                </Text>
                                <Flex style={{ flexDirection: 'column', gap: vars.spacing['2'] }}>
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
                                </Flex>
                            </Flex>
                        )}

                        <Divider />

                        <Text as="h2" size="lg" weight="bold">
                            {globalize.translate('HeaderChannelAccess')}
                        </Text>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.enableAllChannels}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            enableAllChannels: e.target.checked,
                                            enabledChannels: e.target.checked ? [] : prev.enabledChannels
                                        }))
                                    }
                                />
                            }
                            label={globalize.translate('OptionEnableAccessToAllChannels')}
                        />

                        {!formData.enableAllChannels && (
                            <Flex style={{ marginLeft: '16px', flexDirection: 'column', gap: vars.spacing['2'] }}>
                                <Text as="span" size="sm" color="secondary">
                                    {globalize.translate('Channels')}
                                </Text>
                                <Flex style={{ flexDirection: 'column', gap: vars.spacing['2'] }}>
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
                                </Flex>
                            </Flex>
                        )}

                        <Flex style={{ marginTop: vars.spacing['4'], gap: vars.spacing['4'] }}>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? globalize.translate('Loading') + '...' : globalize.translate('Save')}
                            </Button>
                            <Button type="button" variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
                                {globalize.translate('ButtonCancel')}
                            </Button>
                        </Flex>
                    </Flex>
                </form>
            </Flex>
        </Page>
    );
};

export default UserNew;
