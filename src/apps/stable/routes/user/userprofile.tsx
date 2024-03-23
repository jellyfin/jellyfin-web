import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
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
import globalize from '../../../../scripts/globalize';
import { appHost } from '../../../../components/apphost';
import confirm from '../../../../components/confirm/confirm';
import toast from '../../../../components/toast/toast';
import Page from '../../../../components/Page';
import Loading from 'components/loading/LoadingComponent';
import UserPasswordForm from 'components/dashboard/users/form/UserPasswordForm';

const UserProfile: FC = () => {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const theme = useTheme();

    const {
        isInitialLoading,
        data: user
    } = userHooks.useGetUserById(userId);

    const { data: imageUrl } = imageHooks.useGetUserImage({
        userId: user?.Id || '',
        tag: user?.PrimaryImageTag || '',
        imageType: ImageType.Primary
    });

    const { user: loggedInUser } = useApi();

    const deleteUserImage = imageHooks.useDeleteUserImage();
    const postUserImage = imageHooks.usePostUserImage();
    const queryClient = useQueryClient();

    const profileImage = useRef<HTMLInputElement | null>(null);

    const onDeleteUserImage = useCallback(() => {
        confirm(
            globalize.translate('DeleteImageConfirmation'),
            globalize.translate('DeleteImage')
        )
            .then(function () {
                deleteUserImage.mutate(
                    {
                        userId: user?.Id || '',
                        imageType: ImageType.Primary
                    },
                    {
                        onSuccess: async () => {
                            await queryClient.invalidateQueries({
                                queryKey: ['UserById', user?.Id]
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
    }, [deleteUserImage, queryClient, user?.Id]);

    const onUploadUserImage = useCallback(() => {
        profileImage.current?.click();
    }, []);

    const onFileReaderAbort = useCallback(() => {
        toast(globalize.translate('FileReadCancelled'));
    }, []);

    const onFileReaderError = useCallback(
        (evt: ProgressEvent<FileReader>) => {
            switch (evt.target?.error?.code) {
                case DOMException.NOT_FOUND_ERR:
                    toast(globalize.translate('FileNotFound'));
                    break;
                case DOMException.ABORT_ERR:
                    onFileReaderAbort();
                    break;
                default:
                    toast(globalize.translate('FileReadError'));
            }
        },
        [onFileReaderAbort]
    );

    const changeProfileImage = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
            const selected = e.target.files?.[0];

            if (selected && ALLOWED_TYPES.includes(selected.type)) {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader?.result as string;
                    const data = result.split(',')[1];
                    postUserImage.mutate(
                        {
                            userId: user?.Id || '',
                            imageType: ImageType.Primary,
                            body: data
                        },
                        {
                            onSuccess: async () => {
                                await queryClient.invalidateQueries({
                                    queryKey: ['UserById', user?.Id]
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
                return reader.readAsDataURL(selected);
            }
        },
        [
            onFileReaderAbort,
            onFileReaderError,
            postUserImage,
            queryClient,
            user?.Id
        ]
    );

    if (isInitialLoading) return <Loading />;

    return (
        <Page
            id='userProfilePage'
            title={globalize.translate('Profile')}
            className='mainAnimatedPage libraryPage userPreferencesPage userPasswordPage noSecondaryNavPage'
        >
            {user ? (
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
                                onClick={onUploadUserImage}
                                alt={user.Name || undefined}
                                src={imageUrl}
                                sx={{
                                    bgcolor: theme.palette.primary.dark,
                                    color: 'inherit',
                                    width: 200,
                                    height: 200,
                                    cursor: 'pointer'
                                }}
                            />

                            <input
                                hidden
                                type='file'
                                accept='image/*'
                                ref={profileImage}
                                onChange={changeProfileImage}
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
                                {user.Name}
                            </Typography>

                            {user?.PrimaryImageTag ? (
                                <Button
                                    className='emby-button raised'
                                    onClick={onDeleteUserImage}
                                >
                                    {globalize.translate('DeleteImage')}
                                </Button>
                            ) : (
                                appHost.supports('fileinput')
                                && (loggedInUser?.Policy?.IsAdministrator
                                    || user.Policy
                                        ?.EnableUserPreferenceAccess) && (
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

                    <UserPasswordForm user={user} />

                </Box>
            ) : null}
        </Page>
    );
};

export default UserProfile;
