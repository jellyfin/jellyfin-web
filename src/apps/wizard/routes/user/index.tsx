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
import confirm from 'components/confirm/confirm';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getPreviousStepPath, getWizardNextPath, useIsFromSummary } from 'apps/wizard/utils/wizardSteps';

export const Component = () => {
    const { data: startupUser, isPending, isError } = useStartupUser();
    const [ data, setData ] = useState<StartupUserDto>({});
    const [ passwordConfirm, setPasswordConfirm ] = useState('');
    const [ toastOpen, setToastOpen ] = useState(false);
    const [ toastMessage, setToastMessage ] = useState('');
    const updateUser = useUpdateStartupUser();
    const navigate = useNavigate();
    const isFromSummary = useIsFromSummary();

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

    const submit = useCallback((newConfig: StartupUserDto) => {
        const name = newConfig.Name || '';
        const password = newConfig.Password || '';

        updateUser.mutate({ startupUserDto: newConfig }, {
            onSuccess: () => {
                const apiClient = ServerConnections.currentApiClient();
                // Authenticate as the new admin so later wizard steps (network/encoding
                // config, library folder browsing) have the rights they need.
                Promise.resolve(apiClient?.getCurrentUser())
                    .then(currentUser => {
                        if (currentUser?.Name !== name) {
                            return apiClient?.authenticateUserByName(name, password);
                        }
                    })
                    .catch(() => apiClient?.authenticateUserByName(name, password))
                    .then(() => navigate(getWizardNextPath('user', isFromSummary)!))
                    .catch((err: unknown) => {
                        console.error('[Wizard > User] failed to authenticate as new admin', err);
                        setToastMessage(globalize.translate('ErrorDefault'));
                        setToastOpen(true);
                    });
            }
        });
    }, [ updateUser, navigate, isFromSummary ]);

    const onNext = useCallback(() => {
        // Guard against double-submit while the mutation is already in flight.
        if (updateUser.isPending) return;

        const newConfig: StartupUserDto = { ...startupUser, ...data };

        if (newConfig?.Password && newConfig.Password !== passwordConfirm) {
            setToastMessage(globalize.translate('PasswordMatchError'));
            setToastOpen(true);
            return;
        }

        if (!newConfig?.Password) {
            confirm({
                title: globalize.translate('HeaderAdminPasswordWarning'),
                text: globalize.translate('MessageAdminPasswordBlankWarning'),
                primary: 'delete'
            }).then(() => submit(newConfig)).catch(() => {
                // User chose to set a password instead
            });
            return;
        }

        submit(newConfig);
    }, [ startupUser, data, passwordConfirm, updateUser.isPending, submit ]);

    const onPrevious = useCallback(() => {
        navigate(getPreviousStepPath('user')!);
    }, [navigate]);

    if (isPending) return <Loading />;

    return (
        <WizardPage
            id='wizardUserPage'
            onPrevious={onPrevious}
            onNext={onNext}
            nextLabel={isFromSummary ? globalize.translate('ReturnToSummary') : undefined}
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
                            helperText={globalize.translate('SetupAdminPasswordNote')}
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

                        <Typography>{globalize.translate('MoreUsersCanBeAddedNextStep')}</Typography>
                    </>
                )}
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'WizardUserPage';
