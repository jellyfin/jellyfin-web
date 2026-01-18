import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormHelperText from '@mui/material/FormHelperText';
import { useSetRemoteAccess } from 'apps/wizard/api/useSetRemoteAccess';
import type { StartupRemoteAccessDto } from '@jellyfin/sdk/lib/generated-client/models/startup-remote-access-dto';

export const Component = () => {
    const navigate = useNavigate();
    const [ data, setData ] = useState<StartupRemoteAccessDto>({
        EnableRemoteAccess: true,
        EnableAutomaticPortMapping: false
    });
    const setRemoteAccess = useSetRemoteAccess();

    const onCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setData({
            ...data,
            [e.target.name]: e.target.checked
        });
    }, [ data ]);

    const onPrevious = useCallback(() => {
        navigate('/wizard/library');
    }, [ navigate ]);

    const onNext = useCallback(() => {
        setRemoteAccess.mutate({ startupRemoteAccessDto: data }, {
            onSuccess: () => {
                navigate('/wizard/finish');
            }
        });
    }, [ navigate, data, setRemoteAccess ]);

    return (
        <WizardPage
            id='wizardSettingsPage'
            onPrevious={onPrevious}
            onNext={onNext}
        >
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('HeaderConfigureRemoteAccess')}</Typography>

                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name='EnableRemoteAccess'
                                checked={data.EnableRemoteAccess}
                                onChange={onCheckboxChange}
                            />
                        }
                        label={globalize.translate('AllowRemoteAccess')}
                    />
                    <FormHelperText>{globalize.translate('AllowRemoteAccessHelp')}</FormHelperText>
                </FormControl>
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'RemoteStartupPage';
