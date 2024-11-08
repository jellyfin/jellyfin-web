import React, { type FC, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { imageHooks, userHooks } from 'hooks/api';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { appHost } from 'components/apphost';
import confirm from 'components/confirm/confirm';
import toast from 'components/toast/toast';
import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';
import UserPasswordForm from 'apps/dashboard/features/users/components/forms/UserPasswordForm';

const UserProfile: FC = () => {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const { user: loggedInUser } = useApi();
    const theme = useTheme();
    const queryClient = useQueryClient();

    const { isLoading, data: currentUser } = userHooks.useGetUserById(userId);

    const { data: imgUrl } = imageHooks.useGetUserImageUrl(currentUser, {
        tag: currentUser?.PrimaryImageTag || ''
    });

    const deleteUserImageMutation = imageHooks.useDeleteUserImage();
    const postUserImageMutation = imageHooks.usePostUserImage();

    const profileImage = useRef<HTMLInputElement | null>(null);

    const isAdministrator = loggedInUser?.Policy?.IsAdministrator;
    const enableUserPreferenceAccess =
        currentUser?.Policy?.EnableUserPreferenceAccess;
    const canEditUserPreference = isAdministrator || enableUserPreferenceAccess;

    const onDeleteUserImage = useCallback(() => {
        confirm(
            globalize.translate('DeleteImageConfirmation'),
            globalize.translate('DeleteImage')
        )
            .then(function () {
                deleteUserImageMutation.mutate(
                    {
                        userId: currentUser?.Id
                    },
                    {
                        onSuccess: async () => {
                            await queryClient.invalidateQueries({
                                queryKey: ['UserById', currentUser?.Id]
                            });
                        },
                        onError: (err) => {
                            console.error(
                                '[userprofile] failed to delete image',
                                err
                            );
                        }
                    }
                );
            })
            .catch(() => {
                // confirm dialog closed
            });
    }, [deleteUserImageMutation, queryClient, currentUser?.Id]);

    const onUploadUserImage = useCallback(() => {
        profileImage.current?.click();
    }, []);

    const onFileReaderAbort = useCallback(() => {
        toast(globalize.translate('FileReadCancelled'));
    }, []);

    const onFileReaderError = useCallback(
        (evt: ProgressEvent<FileReader>) => {
            const errorName = evt.target?.error?.name;
            switch (errorName) {
                case 'NotFoundError':
                    toast(globalize.translate('FileNotFound'));
                    break;
                case 'AbortError':
                    onFileReaderAbort();
                    break;
                default:
                    toast(globalize.translate('FileReadError'));
            }
        },
        [onFileReaderAbort]
    );

    const handleProfileImageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];

            if (file?.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader?.result as string;
                    const data = result.split(',')[1];
                    postUserImageMutation.mutate(
                        {
                            params: {
                                userId: currentUser?.Id,
                                body: data as unknown as File
                            },
                            options: {
                                headers: {
                                    'Content-Type': file.type
                                }
                            }
                        },
                        {
                            onSuccess: async () => {
                                await queryClient.invalidateQueries({
                                    queryKey: ['UserById', currentUser?.Id]
                                });
                            },
                            onError: (err) => {
                                console.error(
                                    '[userprofile] failed to upload image',
                                    err
                                );
                            }
                        }
                    );
                };

                reader.onerror = onFileReaderError;
                reader.onabort = onFileReaderAbort;
                return reader.readAsDataURL(file);
            } else {
                toast(globalize.translate('MessageImageFileTypeAllowed'));
            }
        },
        [
            onFileReaderError,
            onFileReaderAbort,
            postUserImageMutation,
            currentUser?.Id,
            queryClient
        ]
    );

    if (isLoading) return <Loading />;

    return (
        <Page
            id='userProfilePage'
            title={globalize.translate('Profile')}
            className='mainAnimatedPage libraryPage userPreferencesPage userPasswordPage noSecondaryNavPage'
        >
            {loggedInUser && currentUser ? (
                <Box className='padded-left padded-right padded-bottom-page'>
                    <Box
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            gap: 2,
                            mb: 4
                        }}
                    >
                        <Box>
                            <Avatar
                                onClick={
                                    appHost.supports('fileinput')
                                    && !currentUser.PrimaryImageTag
                                    && canEditUserPreference ?
                                        onUploadUserImage :
                                        undefined
                                }
                                alt={currentUser.Name || undefined}
                                src={imgUrl}
                                sx={{
                                    bgcolor: theme.palette.primary.dark,
                                    color: 'inherit',
                                    width: 200,
                                    height: 200,
                                    cursor:
                                        !currentUser.PrimaryImageTag
                                        && canEditUserPreference ?
                                            'pointer' :
                                            undefined
                                }}
                            />

                            <input
                                hidden
                                type='file'
                                accept='image/*'
                                ref={profileImage}
                                onChange={handleProfileImageChange}
                            />
                        </Box>
                        <Stack
                            direction='column'
                            alignItems='center'
                            spacing={1}
                            useFlexGap
                        >
                            <Typography
                                color='text.primary'
                                fontSize='xx-large'
                                fontWeight='semiBold'
                            >
                                {currentUser.Name}
                            </Typography>

                            {currentUser.PrimaryImageTag
                            && canEditUserPreference ? (
                                    <Button
                                        className='emby-button raised'
                                        onClick={onDeleteUserImage}
                                    >
                                        {globalize.translate('DeleteImage')}
                                    </Button>
                                ) : (
                                    appHost.supports('fileinput')
                                && canEditUserPreference && (
                                        <Button
                                            className='emby-button raised button-submit'
                                            onClick={onUploadUserImage}
                                        >
                                            {globalize.translate('ButtonAddImage')}
                                        </Button>
                                    )
                                )}
                        </Stack>
                    </Box>

                    {canEditUserPreference && (
                        <UserPasswordForm currentUser={currentUser} />
                    )}
                </Box>
            ) : null}
        </Page>
    );
};

export default UserProfile;
