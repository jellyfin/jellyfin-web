import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import type { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client/models/network-configuration';
import type { EncodingOptions } from '@jellyfin/sdk/lib/generated-client/models/encoding-options';
import { HardwareAccelerationType } from '@jellyfin/sdk/lib/generated-client/models/hardware-acceleration-type';
import { useNamedConfiguration } from 'hooks/useNamedConfiguration';
import { getWizardDraft } from 'apps/wizard/utils/wizardDraft';
import { getPreviousStepPath, getWizardNextPath, useIsFromSummary } from 'apps/wizard/utils/wizardSteps';
import { validatePort } from 'apps/wizard/utils/wizardPortValidation';

export const Component = () => {
    const navigate = useNavigate();
    const {
        data: networkConfig,
        isPending: isNetworkConfigPending
    } = useNamedConfiguration<NetworkConfiguration>('network');
    const {
        data: encodingConfig,
        isPending: isEncodingConfigPending
    } = useNamedConfiguration<EncodingOptions>('encoding');
    const draft = getWizardDraft();
    const isFromSummary = useIsFromSummary();
    const [ httpPort, setHttpPort ] = useState<string>();
    const [ hardwareAccelerationType, setHardwareAccelerationType ] = useState<string>();

    const resolvedHttpPort = httpPort
        ?? String(draft.network.InternalHttpPort ?? networkConfig?.InternalHttpPort ?? '');
    const resolvedHardwareAccelerationType = hardwareAccelerationType
        ?? draft.encoding.HardwareAccelerationType
        ?? encodingConfig?.HardwareAccelerationType
        ?? HardwareAccelerationType.None;

    const onPrevious = useCallback(() => {
        navigate(getPreviousStepPath('advanced')!);
    }, [ navigate ]);

    const onNext = useCallback(() => {
        // The HTTPS port is set on the previous step; both servers can't share a port.
        const conflictPort = String(draft.network.InternalHttpsPort ?? networkConfig?.InternalHttpsPort ?? '');
        void validatePort(resolvedHttpPort, conflictPort).then(valid => {
            if (!valid) return;

            draft.encoding.HardwareAccelerationType = resolvedHardwareAccelerationType as HardwareAccelerationType;

            const parsedHttpPort = Number.parseInt(resolvedHttpPort, 10);
            if (!Number.isNaN(parsedHttpPort)) {
                draft.network.InternalHttpPort = parsedHttpPort;
            }

            navigate(getWizardNextPath('advanced', isFromSummary)!);
        });
    }, [ resolvedHttpPort, resolvedHardwareAccelerationType, draft, networkConfig, navigate, isFromSummary ]);

    if (isNetworkConfigPending || isEncodingConfigPending) return <Loading />;

    return (
        <WizardPage
            id='wizardAdvancedPage'
            onPrevious={onPrevious}
            onNext={onNext}
            nextLabel={isFromSummary ? globalize.translate('ReturnToSummary') : undefined}
        >
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('HeaderAdvancedSettings')}</Typography>

                <Alert severity='info'>{globalize.translate('WizardAdvancedSettingsDisclaimer')}</Alert>

                <TextField
                    type='number'
                    label={globalize.translate('LabelLocalHttpServerPortNumber')}
                    helperText={`${globalize.translate('LabelLocalHttpServerPortNumberHelp')} ${globalize.translate('WizardPortRestartNote')}`}
                    value={resolvedHttpPort}
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={e => setHttpPort(e.target.value)}
                />

                <Typography variant='h2'>{globalize.translate('HeaderTranscoding')}</Typography>

                <TextField
                    select
                    label={globalize.translate('LabelHardwareAccelerationType')}
                    value={resolvedHardwareAccelerationType}
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={e => setHardwareAccelerationType(e.target.value)}
                    helperText={(
                        <>
                            {globalize.translate('LabelHardwareAccelerationTypeHelp')}{' '}
                            <Link href='https://jellyfin.org/docs/general/administration/hardware-acceleration/' target='_blank'>
                                {globalize.translate('ButtonLearnMore')}
                            </Link>
                        </>
                    )}
                >
                    <MenuItem value={HardwareAccelerationType.None}>{globalize.translate('None')}</MenuItem>
                    <MenuItem value={HardwareAccelerationType.Amf}>AMD AMF</MenuItem>
                    <MenuItem value={HardwareAccelerationType.Nvenc}>Nvidia NVENC</MenuItem>
                    <MenuItem value={HardwareAccelerationType.Qsv}>Intel Quicksync (QSV)</MenuItem>
                    <MenuItem value={HardwareAccelerationType.Vaapi}>Video Acceleration API (VAAPI)</MenuItem>
                    <MenuItem value={HardwareAccelerationType.Rkmpp}>Rockchip MPP (RKMPP)</MenuItem>
                    <MenuItem value={HardwareAccelerationType.Videotoolbox}>Apple VideoToolBox</MenuItem>
                    <MenuItem value={HardwareAccelerationType.V4l2m2m}>Video4Linux2 (V4L2)</MenuItem>
                </TextField>

                {resolvedHardwareAccelerationType !== HardwareAccelerationType.None ? (
                    <Typography variant='caption'>{globalize.translate('HardwareAccelerationWarning')}</Typography>
                ) : null}
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'WizardAdvancedPage';
