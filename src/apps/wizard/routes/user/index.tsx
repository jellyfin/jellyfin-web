import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import { useNavigate } from 'react-router-dom';
import { useStartupUser } from 'apps/wizard/api/useStartupUser';
import Loading from 'components/loading/LoadingComponent';
import Alert from '@mui/material/Alert';
import type { StartupUserDto } from '@jellyfin/sdk/lib/generated-client/models/startup-user-dto';
import TextField from '@mui/material/TextField';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import { useUpdateStartupUser } from 'apps/wizard/api/useUpdateStartupUser';

export const Component = () => {
    const { data: startupUser, isPending, isError } = useStartupUser();
    const [ data, setData ] = useState<StartupUserDto>({});
    const [ passwordConfirm, setPasswordConfirm ] = useState('');
    const [ toastOpen, setToastOpen ] = useState(false);
    const [ toastMessage, setToastMessage ] = useState('');
    const updateUser = useUpdateStartupUser();
    const navigate = useNavigate();

    const onPasswordConfirmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordConfirm(e.target.value);
    }, []);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setData({
            ...data,
            [e.target.name]: e.target.value
        });
    }, [ data ]);

    const onConfirmToastClose = useCallback((e: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }

        setToastOpen(false);
    }, []);

    const onNext = useCallback(() => {
        const newConfig: StartupUserDto = { ...startupUser, ...data };

        if (!newConfig?.Password) {
            setToastMessage(globalize.translate('PasswordMissingSaveError'));
            setToastOpen(true);
        } else if (newConfig?.Password !== passwordConfirm) {
            setToastMessage(globalize.translate('PasswordMatchError'));
            setToastOpen(true);
        } else {
            updateUser.mutate({ startupUserDto: newConfig }, {
                onSuccess: () => {
                    navigate('/wizard/library');
                }
            });
        }
    }, [ startupUser, data, passwordConfirm, updateUser, navigate ]);

    const onPrevious = useCallback(() => {
        navigate('/wizard/start');
    }, [navigate]);

    if (isPending) return <Loading />;

    return (
        <WizardPage
            id='wizardUserPage'
            onPrevious={onPrevious}
            onNext={onNext}
        >
            <Snackbar
                open={toastOpen}
                autoHideDuration={3300}
                onClose={onConfirmToastClose}
                message={toastMessage}
            />
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('TellUsAboutYourself')}</Typography>
                {isError ? (
                    <Alert severity='error'>{globalize.translate('WizardPageLoadError')}</Alert>
                ) : (
                    <>
                        <Typography>{globalize.translate('UserProfilesIntro')}</Typography>

                        <TextField
                            name='Name'
                            label={globalize.translate('LabelUsername')}
                            helperText={globalize.translate('SelectAdminUsername')}
                            value={data?.Name || startupUser?.Name || ''}
                            onChange={onChange}
                        />

                        <TextField
                            name='Password'
                            label={globalize.translate('LabelPassword')}
                            helperText={globalize.translate('PasswordRequiredForAdmin')}
                            type='password'
                            value={data?.Password || startupUser?.Password || ''}
                            onChange={onChange}
                        />

                        <TextField
                            name='PasswordConfirm'
                            label={globalize.translate('LabelPasswordConfirm')}
                            type='password'
                            value={passwordConfirm}
                            onChange={onPasswordConfirmChange}
                        />

                        <Typography>{globalize.translate('MoreUsersCanBeAddedLater')}</Typography>
                    </>
                )}
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'WizardUserPage';
