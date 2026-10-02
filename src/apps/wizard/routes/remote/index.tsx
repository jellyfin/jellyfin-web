import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import globalize from 'lib/globalize';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import Loading from 'components/loading/LoadingComponent';
import toast from 'components/toast/toast';
import confirm from 'components/confirm/confirm';
import type { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client/models/network-configuration';
import { useNamedConfiguration } from 'hooks/useNamedConfiguration';
import { getWizardDraft } from 'apps/wizard/utils/wizardDraft';
import { getPreviousStepPath, getWizardNextPath, useIsFromSummary } from 'apps/wizard/utils/wizardSteps';
import { validatePort } from 'apps/wizard/utils/wizardPortValidation';

interface RemoteAccessFormData {
    EnableRemoteAccess?: boolean;
    EnableUPnP?: boolean;
    EnableHttps?: boolean;
    InternalHttpsPort?: string;
    CertificatePath?: string;
    CertificatePassword?: string;
}

export const Component = () => {
    const navigate = useNavigate();
    const { data: networkConfig, isPending } = useNamedConfiguration<NetworkConfiguration>('network');
    const draft = getWizardDraft();
    const isFromSummary = useIsFromSummary();
    const [ data, setData ] = useState<RemoteAccessFormData>({});

    const enableRemoteAccess = data.EnableRemoteAccess
        ?? draft.remoteAccess.EnableRemoteAccess
        ?? (networkConfig?.EnableRemoteAccess !== false);
    const enableUPnP = data.EnableUPnP ?? draft.network.EnableUPnP ?? networkConfig?.EnableUPnP ?? false;
    const enableHttps = data.EnableHttps ?? draft.network.EnableHttps ?? networkConfig?.EnableHttps ?? false;
    const httpsPort = data.InternalHttpsPort
        ?? String(draft.network.InternalHttpsPort ?? networkConfig?.InternalHttpsPort ?? '');
    const certificatePath = data.CertificatePath
        ?? String(draft.network.CertificatePath ?? networkConfig?.CertificatePath ?? '');
    const certificatePassword = data.CertificatePassword ?? '';

    const onRemoteAccessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        // UPnP is only relevant when remote access is allowed.
        setData(prev => ({ ...prev, EnableRemoteAccess: checked, EnableUPnP: checked ? prev.EnableUPnP : false }));
    }, []);

    const onUPnPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        if (checked) {
            confirm({
                title: globalize.translate('HeaderUPnPSecurityWarning'),
                text: globalize.translate('MessageUPnPSecurityWarning'),
                primary: 'delete'
            }).then(() => setData(prev => ({ ...prev, EnableUPnP: true })))
                .catch(() => setData(prev => ({ ...prev, EnableUPnP: false })));
        } else {
            setData(prev => ({ ...prev, EnableUPnP: false }));
        }
    }, []);

    const onPrevious = useCallback(() => {
        navigate(getPreviousStepPath('remote')!);
    }, [ navigate ]);

    const onNext = useCallback(() => {
        // HTTPS will silently fail to bind on the server without a certificate.
        if (enableHttps && !certificatePath.trim()) {
            toast(globalize.translate('MessageHttpsCertificateRequired'));
            return;
        }

        // The HTTP port is set on the next (advanced) step; both servers can't share a port.
        const conflictPort = String(draft.network.InternalHttpPort ?? networkConfig?.InternalHttpPort ?? '');
        void validatePort(httpsPort, conflictPort).then(valid => {
            if (!valid) return;

            draft.remoteAccess.EnableRemoteAccess = enableRemoteAccess;
            draft.network.EnableUPnP = enableUPnP;
            draft.network.EnableHttps = enableHttps;
            draft.network.CertificatePath = certificatePath || undefined;
            // Leave the stored password untouched when the field is blank, so it isn't cleared on revisit.
            if (certificatePassword) {
                draft.network.CertificatePassword = certificatePassword;
            }
            const parsedHttpsPort = Number.parseInt(httpsPort, 10);
            if (!Number.isNaN(parsedHttpsPort)) {
                draft.network.InternalHttpsPort = parsedHttpsPort;
            }

            navigate(getWizardNextPath('remote', isFromSummary)!);
        });
    }, [ enableHttps, certificatePath, certificatePassword, httpsPort, enableRemoteAccess, enableUPnP, draft, networkConfig, navigate, isFromSummary ]);

    if (isPending) return <Loading />;

    return (
        <WizardPage
            id='wizardSettingsPage'
            onPrevious={onPrevious}
            onNext={onNext}
            nextLabel={isFromSummary ? globalize.translate('ReturnToSummary') : undefined}
        >
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('HeaderConfigureRemoteAccess')}</Typography>

                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={enableRemoteAccess}
                                onChange={onRemoteAccessChange}
                            />
                        }
                        label={globalize.translate('AllowRemoteAccess')}
                    />
                    <FormHelperText>
                        {globalize.translate('AllowRemoteAccessHelp')}{' '}
                        <Link component={RouterLink} to='https://jellyfin.org/docs/general/networking/' target='_blank'>
                            {globalize.translate('ButtonLearnMore')}
                        </Link>
                    </FormHelperText>
                </FormControl>

                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={enableUPnP}
                                disabled={!enableRemoteAccess}
                                onChange={onUPnPChange}
                            />
                        }
                        label={globalize.translate('LabelEnableUPnP')}
                    />
                    <FormHelperText>{globalize.translate('EnableUPnPHelp')}</FormHelperText>
                </FormControl>

                <FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={enableHttps}
                                // eslint-disable-next-line react/jsx-no-bind
                                onChange={e => setData(prev => ({ ...prev, EnableHttps: e.target.checked }))}
                            />
                        }
                        label={globalize.translate('LabelEnableHttps')}
                    />
                    <FormHelperText>
                        {globalize.translate('LabelEnableHttpsHelp')}{' '}
                        <Link component={RouterLink} to='https://jellyfin.org/docs/general/networking/#https' target='_blank'>
                            {globalize.translate('ButtonLearnMore')}
                        </Link>
                    </FormHelperText>
                </FormControl>

                {enableHttps ? (
                    <>
                        <TextField
                            type='number'
                            label={globalize.translate('LabelHttpsPort')}
                            helperText={globalize.translate('LabelHttpsPortHelp')}
                            value={httpsPort}
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange={e => setData(prev => ({ ...prev, InternalHttpsPort: e.target.value }))}
                        />
                        <TextField
                            label={globalize.translate('LabelCustomCertificatePath')}
                            helperText={globalize.translate('LabelCustomCertificatePathHelp')}
                            value={certificatePath}
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange={e => setData(prev => ({ ...prev, CertificatePath: e.target.value }))}
                        />
                        <TextField
                            type='password'
                            label={globalize.translate('LabelCertificatePassword')}
                            helperText={globalize.translate('LabelCertificatePasswordHelp')}
                            value={certificatePassword}
                            // eslint-disable-next-line react/jsx-no-bind
                            onChange={e => setData(prev => ({ ...prev, CertificatePassword: e.target.value }))}
                        />
                    </>
                ) : null}

                <Typography variant='caption'>{globalize.translate('WizardSettingsChangeableLater')}</Typography>
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'RemoteStartupPage';
