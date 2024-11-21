import type { UserPolicy } from '@jellyfin/sdk/lib/generated-client/models/user-policy';
import React, { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import {
    type SubmitHandler,
    useForm,
    CheckboxButtonGroup,
    CheckboxElement
} from 'react-hook-form-mui';
import {
    libraryHooks,
    channelsHooks,
    userHooks,
    devicesHooks
} from 'hooks/api';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';
import Loading from 'components/loading/LoadingComponent';
import { getDevicesTitle } from '../../utils/item';

interface UserAccessFormProps {
    currentUserPolicy: UserPolicy;
    currentUserId: string;
}

const UserAccessForm: FC<UserAccessFormProps> = ({
    currentUserPolicy,
    currentUserId
}) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const updateUserPolicyMutation = userHooks.useUpdateUserPolicy();

    const { isLoading: isMediaFoldersLoading, data: mediaFolders } =
        libraryHooks.useGetMediaFolders({
            isHidden: false
        });
    const { isLoading: isChannelsLoading, data: channels } =
        channelsHooks.useGetChannels({
            userId: currentUserId
        });
    const { isLoading: isDevicesLoading, data: devices } =
        devicesHooks.useGetDevices({
            userId: currentUserId
        });

    const { control, formState, handleSubmit, watch, reset } =
        useForm<UserPolicy>({
            defaultValues: {
                ...currentUserPolicy,
                BlockedChannels: null,
                BlockedMediaFolders: null
            }
        });

    const onSubmit: SubmitHandler<UserPolicy> = useCallback(
        async (data) => {
            try {
                await updateUserPolicyMutation.mutateAsync({
                    userId: currentUserId,
                    userPolicy: {
                        ...data,
                        EnableAllFolders: data?.EnableAllFolders,
                        EnabledFolders: data?.EnableAllFolders ?
                            [] :
                            data?.EnabledFolders,
                        EnableAllChannels: data?.EnableAllChannels,
                        EnabledChannels: data?.EnableAllChannels ?
                            [] :
                            data?.EnabledChannels,
                        EnableAllDevices: data?.EnableAllDevices,
                        EnabledDevices: data?.EnableAllDevices ?
                            [] :
                            data?.EnabledDevices
                    }
                });

                toast(globalize.translate('SettingsSaved'));
                await queryClient.invalidateQueries({
                    queryKey: ['UserById', currentUserId]
                });
            } catch (error) {
                toast(globalize.translate('ErrorDefault'));
                console.error(
                    '[UserAccessForm] Error during submission:',
                    error
                );
            }
        },
        [queryClient, updateUserPolicyMutation, currentUserId]
    );

    const handleCancel = useCallback(() => {
        reset();
    }, [reset]);

    if (isMediaFoldersLoading || isChannelsLoading || isDevicesLoading) {
        return <Loading />;
    }

    return (
        <Stack component='form' spacing={2} onSubmit={handleSubmit(onSubmit)}>
            {mediaFolders?.length ? (
                <Card sx={{ borderRadius: 2 }}>
                    <CardHeader
                        title={globalize.translate('HeaderLibraryAccess')}
                    />
                    <CardContent component={Stack}>
                        <CheckboxElement
                            name={'EnableAllFolders'}
                            control={control}
                            label={globalize.translate(
                                'OptionEnableAccessToAllLibraries'
                            )}
                        />

                        {!watch('EnableAllFolders') && (
                            <Box
                                sx={{
                                    p: 2,
                                    backgroundColor:
                                        theme.palette.background.paper
                                }}
                            >
                                <CheckboxButtonGroup
                                    label={globalize.translate(
                                        'HeaderLibraries'
                                    )}
                                    name='EnabledFolders'
                                    control={control}
                                    options={mediaFolders.map((item) => ({
                                        id: item.Id,
                                        label: item.Name
                                    }))}
                                    helperText={globalize.translate(
                                        'LibraryAccessHelp'
                                    )}
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ) : null}

            {channels?.length ? (
                <Card sx={{ borderRadius: 2 }}>
                    <CardHeader
                        title={globalize.translate('HeaderChannelAccess')}
                    />
                    <CardContent component={Stack}>
                        <CheckboxElement
                            name={'EnableAllChannels'}
                            control={control}
                            label={globalize.translate(
                                'OptionEnableAccessToAllChannels'
                            )}
                        />

                        {!watch('EnableAllChannels') && (
                            <Box
                                sx={{
                                    p: 2,
                                    backgroundColor:
                                        theme.palette.background.paper
                                }}
                            >
                                <CheckboxButtonGroup
                                    label={globalize.translate('Channels')}
                                    name='EnabledChannels'
                                    control={control}
                                    options={channels.map((item) => ({
                                        id: item.Id,
                                        label: item.Name
                                    }))}
                                    helperText={globalize.translate(
                                        'ChannelAccessHelp'
                                    )}
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ) : null}

            {devices?.length && !currentUserPolicy?.IsAdministrator ? (
                <Card sx={{ borderRadius: 2 }}>
                    <CardHeader
                        title={globalize.translate('HeaderDeviceAccess')}
                    />
                    <CardContent component={Stack}>
                        <CheckboxElement
                            name={'EnableAllDevices'}
                            control={control}
                            label={globalize.translate(
                                'OptionEnableAccessFromAllDevices'
                            )}
                        />

                        {!watch('EnableAllDevices') && (
                            <Box
                                sx={{
                                    p: 2,
                                    backgroundColor:
                                        theme.palette.background.paper
                                }}
                            >
                                <CheckboxButtonGroup
                                    label={globalize.translate('HeaderDevices')}
                                    name='EnabledDevices'
                                    control={control}
                                    options={devices.map((item) => ({
                                        id: item.Id,
                                        label: getDevicesTitle(item)
                                    }))}
                                    helperText={globalize.translate(
                                        'DeviceAccessHelp'
                                    )}
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ) : null}

            <Stack spacing={0.5}>
                <Button
                    type='submit'
                    className='emby-button raised button-submit'
                    disabled={!formState.isDirty || formState.isSubmitting}
                >
                    {globalize.translate('Save')}
                </Button>
                <Button
                    className='emby-button raised button-cancel'
                    disabled={!formState.isDirty}
                    onClick={handleCancel}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Stack>
        </Stack>
    );
};

export default UserAccessForm;
