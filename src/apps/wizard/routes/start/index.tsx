import React, { useCallback, useState } from 'react';
import Typography from '@mui/material/Typography';
import WizardPage from 'apps/wizard/components/WizardPage';
import globalize from 'lib/globalize';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import { useLocalizationOptions } from 'apps/dashboard/features/settings/api/useLocalizationOptions';
import Loading from 'components/loading/LoadingComponent';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { useStartupConfiguration } from 'apps/wizard/api/useStartupConfiguration';
import type { StartupConfigurationDto } from '@jellyfin/sdk/lib/generated-client/models/startup-configuration-dto';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { getWizardDraft } from 'apps/wizard/utils/wizardDraft';
import { getWizardNextPath, useIsFromSummary } from 'apps/wizard/utils/wizardSteps';

export const Component = () => {
    const {
        data: config,
        isPending: isConfigPending,
        isError: isConfigError
    } = useStartupConfiguration();
    const {
        data: languageOptions,
        isPending: isLocalizationOptionsPending,
        isError: isLocalizationOptionsError
    } = useLocalizationOptions();
    const navigate = useNavigate();
    const [ data, setData ] = useState<StartupConfigurationDto>({});
    const draft = getWizardDraft().config;
    const isFromSummary = useIsFromSummary();

    const onNext = useCallback(() => {
        Object.assign(getWizardDraft().config, {
            ServerName: data?.ServerName || draft.ServerName || config?.ServerName,
            UICulture: data?.UICulture || draft.UICulture || config?.UICulture
        });
        navigate(getWizardNextPath('start', isFromSummary)!);
    }, [ config, data, draft, isFromSummary, navigate ]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setData({
            ...data,
            [e.target.name]: e.target.value
        });
    }, [ data ]);

    if (isLocalizationOptionsPending || isConfigPending) return <Loading />;

    return (
        <WizardPage
            id='wizardStartPage'
            onNext={onNext}
            nextLabel={isFromSummary ? globalize.translate('ReturnToSummary') : undefined}
        >
            <Stack spacing={3}>
                <Stack direction='row' justifyContent={'space-between'} alignItems={'center'}>
                    <Typography variant='h1'>{globalize.translate('WelcomeToProject')}</Typography>
                    <Button
                        startIcon={<HelpOutlineIcon />}
                        variant='outlined'
                        component={RouterLink}
                        to='https://jellyfin.org/docs/general/post-install/setup-wizard/'
                        target='_blank'
                    >
                        {globalize.translate('ButtonQuickStartGuide')}
                    </Button>
                </Stack>

                {isLocalizationOptionsError || isConfigError ? (
                    <Alert severity='error'>{globalize.translate('WizardPageLoadError')}</Alert>
                ) : (
                    <>
                        <Typography>{globalize.translate('ThisWizardWillGuideYou')}</Typography>

                        <TextField
                            name='ServerName'
                            value={data?.ServerName || draft.ServerName || config.ServerName || ''}
                            onChange={onChange}
                            label={globalize.translate('LabelServerName')}
                            helperText={globalize.translate('LabelServerNameHelp')}
                        />

                        <TextField
                            select
                            name='UICulture'
                            label={globalize.translate('LabelPreferredDisplayLanguage')}
                            value={data?.UICulture || draft.UICulture || config.UICulture}
                            onChange={onChange}
                        >
                            {languageOptions?.map((language) =>
                                <MenuItem key={language.Name} value={language.Value || ''}>{language.Name}</MenuItem>
                            )}
                        </TextField>

                        <Typography variant='caption'>
                            {globalize.translate('LabelLanguageNotListed')}{' '}
                            <Link
                                component={RouterLink}
                                to='https://translate.jellyfin.org/projects/jellyfin/jellyfin-web/'
                                target='_blank'
                            >
                                {globalize.translate('ButtonHelpTranslateJellyfin')}
                            </Link>
                        </Typography>
                    </>
                )}
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'WizardStartPage';
