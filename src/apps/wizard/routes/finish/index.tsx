import React, { useCallback } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import { useCompleteWizard } from 'apps/wizard/api/useCompleteWizard';

export const Component = () => {
    const navigate = useNavigate();
    const completeWizard = useCompleteWizard();

    const onPrevious = useCallback(() => {
        navigate('/wizard/remote');
    }, [ navigate ]);

    const onFinish = useCallback(() => {
        completeWizard.mutate(undefined, {
            onSuccess: () => {
                navigate('/');
            }
        });
    }, [ navigate, completeWizard ]);

    return (
        <WizardPage
            id='wizardFinishPage'
            onPrevious={onPrevious}
            onFinish={onFinish}
        >
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('LabelYoureDone')}</Typography>
                <Typography>{globalize.translate('WizardCompleted')}</Typography>
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'StartupFinishPage';
