import React, { useCallback, useState } from 'react';
import WizardPage from 'apps/wizard/components/WizardPage';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import { useCountries } from 'apps/dashboard/features/libraries/api/useCountries';
import { useCultures } from 'apps/dashboard/features/libraries/api/useCultures';
import { useStartupConfiguration } from 'apps/wizard/api/useStartupConfiguration';
import Loading from 'components/loading/LoadingComponent';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import type { StartupConfigurationDto } from '@jellyfin/sdk/lib/generated-client/models/startup-configuration-dto';
import { getWizardDraft } from 'apps/wizard/utils/wizardDraft';
import { getPreviousStepPath, getWizardNextPath, useIsFromSummary } from 'apps/wizard/utils/wizardSteps';

export const Component = () => {
    const {
        data: startupConfig,
        isPending: isStartupConfigurationPending,
        isError: isStartupConfigurationError
    } = useStartupConfiguration();
    const {
        data: cultures,
        isPending: isCulturesPending,
        isError: isCulturesError
    } = useCultures();
    const {
        data: countries,
        isPending: isCountriesPending,
        isError: isCountriesError
    } = useCountries();
    const navigate = useNavigate();
    const draft = getWizardDraft().config;
    const isFromSummary = useIsFromSummary();
    const [ data, setData ] = useState<StartupConfigurationDto>({});

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setData({
            ...data,
            [e.target.name]: e.target.value
        });
    }, [ data ]);

    const onPrevious = useCallback(() => {
        navigate(getPreviousStepPath('settings')!);
    }, [ navigate ]);

    const onNext = useCallback(() => {
        Object.assign(getWizardDraft().config, {
            PreferredMetadataLanguage: data.PreferredMetadataLanguage || draft.PreferredMetadataLanguage || startupConfig?.PreferredMetadataLanguage,
            MetadataCountryCode: data.MetadataCountryCode || draft.MetadataCountryCode || startupConfig?.MetadataCountryCode
        });
        navigate(getWizardNextPath('settings', isFromSummary)!);
    }, [ navigate, startupConfig, draft, data, isFromSummary ]);

    if (isStartupConfigurationPending || isCulturesPending || isCountriesPending) return <Loading />;

    return (
        <WizardPage
            id='wizardMetadataPage'
            onPrevious={onPrevious}
            onNext={onNext}
            nextLabel={isFromSummary ? globalize.translate('ReturnToSummary') : undefined}
        >
            <Stack spacing={3}>
                <Typography variant='h1'>{globalize.translate('HeaderPreferredMetadataLanguage')}</Typography>

                {isStartupConfigurationError || isCulturesError || isCountriesError ? (
                    <Alert severity='error'>{globalize.translate('WizardPageLoadError')}</Alert>
                ) : (
                    <>
                        <Typography>{globalize.translate('DefaultMetadataLangaugeDescription')}</Typography>

                        <TextField
                            name={'PreferredMetadataLanguage'}
                            label={globalize.translate('LabelLanguage')}
                            value={data.PreferredMetadataLanguage || draft.PreferredMetadataLanguage || startupConfig.PreferredMetadataLanguage}
                            onChange={onChange}
                            select
                        >
                            {cultures.map(culture => {
                                return <MenuItem
                                    key={culture.TwoLetterISOLanguageName}
                                    value={culture.TwoLetterISOLanguageName}
                                >{culture.DisplayName}</MenuItem>;
                            })}
                        </TextField>

                        <TextField
                            name={'MetadataCountryCode'}
                            label={globalize.translate('LabelCountry')}
                            value={data.MetadataCountryCode || draft.MetadataCountryCode || startupConfig.MetadataCountryCode}
                            onChange={onChange}
                            select
                        >
                            {countries.map(country => {
                                return <MenuItem
                                    key={country.DisplayName}
                                    value={country.TwoLetterISORegionName || ''}
                                >{country.DisplayName}</MenuItem>;
                            })}
                        </TextField>
                    </>
                )}
            </Stack>
        </WizardPage>
    );
};

Component.displayName = 'WizardMetadataPage';
