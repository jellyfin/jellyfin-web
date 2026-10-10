import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import toast from 'components/toast/toast';
import { useApi } from 'hooks/useApi';
import { useStartupUser } from 'apps/wizard/api/useStartupUser';
import { useCultures } from 'apps/dashboard/features/libraries/api/useCultures';
import {
    applyWizardDraft,
    getWizardDraft,
    markWizardCompleted,
    type WizardApplyError,
    type WizardStage
} from 'apps/wizard/utils/wizardDraft';
import { getPreviousStepPath, getStepPath } from 'apps/wizard/utils/wizardSteps';

// Maps wizardDraft.ts apply-stage names to a translatable label for error messages.
const STAGE_LABEL_KEYS: Partial<Record<WizardStage, string>> = {
    config: 'WizardSummaryServer',
    users: 'WizardSummaryAdditionalUsers',
    remoteAccess: 'WizardSummaryRemoteAccess',
    libraries: 'WizardSummaryLibraries',
    network: 'WizardSummaryNetwork',
    complete: 'WizardSummaryFinish'
};

interface SummaryRowProps {
    label: string;
    value: string;
    stepId: Parameters<typeof getStepPath>[0];
}

const SummaryRow = ({ label, value, stepId }: SummaryRowProps) => (
    <Stack
        component={RouterLink}
        to={getStepPath(stepId)}
        state={{ fromSummary: true }}
        direction='row'
        justifyContent='space-between'
        gap={2}
        sx={{
            p: 1,
            borderRadius: 1,
            color: 'inherit',
            textDecoration: 'none',
            '&:hover': { backgroundColor: 'action.hover' }
        }}
    >
        <Typography fontWeight='bold'>{label}</Typography>
        <Typography color='text.secondary'>{value}</Typography>
    </Stack>
);

export const Component = () => {
    const navigate = useNavigate();
    const { api } = useApi();
    const { data: adminUser, isPending: isAdminUserPending } = useStartupUser();
    const { data: cultures, isPending: isCulturesPending } = useCultures();
    const [ isApplying, setIsApplying ] = useState(false);
    const draft = getWizardDraft();

    const onPrevious = useCallback(() => {
        navigate(getPreviousStepPath('finish')!);
    }, [ navigate ]);

    const onFinish = useCallback(() => {
        if (isApplying || !api) return;
        setIsApplying(true);

        applyWizardDraft(api).then(() => {
            markWizardCompleted();
            navigate('/');
        }).catch((err: WizardApplyError) => {
            console.error('[Wizard > Summary] failed to complete setup', err);
            console.error('[Wizard > Summary] failed wizard stage', err.wizardStage);
            const labelKey = err.wizardStage && STAGE_LABEL_KEYS[err.wizardStage];
            const message = labelKey ?
                globalize.translate('WizardErrorStageFailed', globalize.translate(labelKey)) :
                globalize.translate('ErrorDefault');
            toast(message);
            setIsApplying(false);
        });
    }, [ api, isApplying, navigate ]);

    if (isAdminUserPending || isCulturesPending) return <Loading />;

    const metadataCulture = cultures?.find(c => c.TwoLetterISOLanguageName === draft.config.PreferredMetadataLanguage);
    const metadataLanguage = metadataCulture?.DisplayName || draft.config.PreferredMetadataLanguage || '';
    const hardwareAcceleration = draft.encoding.HardwareAccelerationType && draft.encoding.HardwareAccelerationType !== 'none' ?
        draft.encoding.HardwareAccelerationType.toUpperCase() :
        globalize.translate('None');
    const yes = globalize.translate('Yes');
    const no = globalize.translate('No');

    return (
        <WizardPage
            id='wizardFinishPage'
            onPrevious={onPrevious}
            onFinish={onFinish}
        >
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('LabelYoureDone')}</Typography>
                <Typography>{globalize.translate('WizardCompleted')}</Typography>

                <Stack sx={{ '& > a': { borderBottom: 1, borderColor: 'divider' } }}>
                    <SummaryRow label={globalize.translate('WizardSummaryServer')} value={draft.config.ServerName || ''} stepId='start' />
                    <SummaryRow label={globalize.translate('WizardSummaryAdmin')} value={adminUser?.Name || ''} stepId='user' />
                    <SummaryRow label={globalize.translate('WizardSummaryAdditionalUsers')} value={String(draft.users.length)} stepId='additional-users' />
                    <SummaryRow label={globalize.translate('WizardSummaryMetadataLanguage')} value={metadataLanguage} stepId='settings' />
                    <SummaryRow label={globalize.translate('WizardSummaryLibraries')} value={String(draft.libraries.length)} stepId='library' />
                    <SummaryRow label={globalize.translate('WizardSummaryRemoteAccess')} value={draft.remoteAccess.EnableRemoteAccess === false ? no : yes} stepId='remote' />
                    <SummaryRow label={globalize.translate('WizardSummaryHttps')} value={draft.network.EnableHttps ? yes : no} stepId='remote' />
                    <SummaryRow label={globalize.translate('WizardSummaryUpnp')} value={draft.network.EnableUPnP ? yes : no} stepId='remote' />
                    <SummaryRow label={globalize.translate('WizardSummaryHttpPort')} value={String(draft.network.InternalHttpPort || '')} stepId='advanced' />
                    <SummaryRow label={globalize.translate('WizardSummaryHardwareAcceleration')} value={hardwareAcceleration} stepId='advanced' />
                </Stack>
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'StartupFinishPage';
