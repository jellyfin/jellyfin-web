import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import ServerConnections from 'components/ServerConnections';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { QUERY_KEY as CONFIG_QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import { fetchNamedConfiguration, QUERY_KEY as NAMED_CONFIG_QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import globalize from 'lib/globalize';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';
import { ActionData } from 'types/actionData';
import { queryClient } from 'utils/query/queryClient';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const { data: config } = await getConfigurationApi(api).getConfiguration();
    const namedConfig = await fetchNamedConfiguration(api, 'metadata');

    namedConfig.UseFileCreationTimeForDateAdded = data.DateAddedBehavior.toString() === '1';
    config.EnableFolderView = data.DisplayFolderView?.toString() === 'on';
    config.DisplaySpecialsWithinSeasons = data.DisplaySpecialsWithinSeasons?.toString() === 'on';
    config.EnableGroupingIntoCollections = data.GroupMoviesIntoCollections?.toString() === 'on';
    config.EnableExternalContentInSuggestions = data.EnableExternalContentInSuggestions?.toString() === 'on';

    await getConfigurationApi(api)
        .updateConfiguration({ serverConfiguration: config });

    await getConfigurationApi(api)
        .updateNamedConfiguration({ key: 'metadata', body: namedConfig });

    void queryClient.invalidateQueries({
        queryKey: [ CONFIG_QUERY_KEY ]
    });
    void queryClient.invalidateQueries({
        queryKey: [ NAMED_CONFIG_QUERY_KEY ]
    });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const {
        data: config,
        isPending: isConfigPending,
        isError: isConfigError
    } = useConfiguration();
    const {
        data: namedConfig,
        isPending: isNamedConfigPending,
        isError: isNamedConfigError
    } = useNamedConfiguration('metadata');

    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';

    if (isConfigPending || isNamedConfigPending) {
        return <Loading />;
    }

    return (
        <Page
            id='libraryDisplayPage'
            title={globalize.translate('Display')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                {isConfigError || isNamedConfigError ? (
                    <Alert severity='error'>{globalize.translate('DisplayLoadError')}</Alert>
                ) : (
                    <Form method='POST'>
                        <Stack spacing={3}>
                            {!isSubmitting && actionData?.isSaved && (
                                <Alert severity='success'>
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}
                            <Typography variant='h2'>{globalize.translate('Display')}</Typography>
                            <TextField
                                name={'DateAddedBehavior'}
                                label={globalize.translate('LabelDateAddedBehavior')}
                                select
                                defaultValue={namedConfig.UseFileCreationTimeForDateAdded ? '1' : '0'}
                                helperText={globalize.translate('LabelDateAddedBehaviorHelp')}
                            >
                                <MenuItem value={'0'}>{globalize.translate('OptionDateAddedImportTime')}</MenuItem>
                                <MenuItem value={'1'}>{globalize.translate('OptionDateAddedFileTime')}</MenuItem>
                            </TextField>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            name={'DisplayFolderView'}
                                            defaultChecked={config.EnableFolderView}
                                        />
                                    }
                                    label={globalize.translate('OptionDisplayFolderView')}
                                />
                                <FormHelperText>{globalize.translate('OptionDisplayFolderViewHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            name={'DisplaySpecialsWithinSeasons'}
                                            defaultChecked={config.DisplaySpecialsWithinSeasons}
                                        />
                                    }
                                    label={globalize.translate('LabelDisplaySpecialsWithinSeasons')}
                                />
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            name={'GroupMoviesIntoCollections'}
                                            defaultChecked={config.EnableGroupingIntoCollections}
                                        />
                                    }
                                    label={globalize.translate('LabelGroupMoviesIntoCollections')}
                                />
                                <FormHelperText>{globalize.translate('LabelGroupMoviesIntoCollectionsHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            name={'EnableExternalContentInSuggestions'}
                                            defaultChecked={config.EnableExternalContentInSuggestions}
                                        />
                                    }
                                    label={globalize.translate('OptionEnableExternalContentInSuggestions')}
                                />
                                <FormHelperText>{globalize.translate('OptionEnableExternalContentInSuggestionsHelp')}</FormHelperText>
                            </FormControl>

                            <Button
                                type='submit'
                                size='large'
                            >
                                {globalize.translate('Save')}
                            </Button>
                        </Stack>
                    </Form>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'DisplayPage';
