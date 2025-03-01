import React from 'react';
import Page from 'components/Page';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ActionFunctionArgs, Form, useActionData, useNavigation} from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ServerConnections from 'components/ServerConnections';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { MetadataConfiguration } from '@jellyfin/sdk/lib/generated-client';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import Loading from 'components/loading/LoadingComponent';
import Alert from '@mui/material/Alert';
import { ActionData } from 'types/actionData';
import { QUERY_KEY as METADATA_QUERY_KEY, useMetadataConfiguration } from 'apps/dashboard/features/libraries/api/useMetadataConfiguration';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');
    const { data: config } = await getConfigurationApi(api).getConfiguration();
    const formData = await request.formData();

    config.EnableFolderView = formData.get('DisplayFolderView')?.toString() === 'on';
    config.DisplaySpecialsWithinSeasons = formData.get('DisplaySpecialsWithinSeasons')?.toString() === 'on';
    config.EnableGroupingIntoCollections = formData.get('GroupMoviesIntoCollections')?.toString() === 'on';
    config.EnableExternalContentInSuggestions = formData.get('EnableExternalContentInSuggestions')?.toString() === 'on';

    const metadataConfiguration: MetadataConfiguration = {
        UseFileCreationTimeForDateAdded: formData.get('DateAddedBehavior')?.toString() === '1'
    };

    await Promise.all([
        getConfigurationApi(api)
            .updateNamedConfiguration({
                key: 'metadata',
                body: JSON.stringify(metadataConfiguration)
            }),
        getConfigurationApi(api)
            .updateConfiguration({ serverConfiguration: config })
    ]);


    void queryClient.invalidateQueries({
        queryKey: [ QUERY_KEY ]
    });
    void queryClient.invalidateQueries({
        queryKey: [ METADATA_QUERY_KEY ]
    });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';

    const { isPending: isConfigurationPending, data: config } = useConfiguration();
    const { isPending: isMetadataPending, data: metadata } = useMetadataConfiguration();

    if (isMetadataPending || isConfigurationPending) {
        return <Loading />;
    }

    return (
        <Page
            id='libraryDisplayPage'
            title={globalize.translate('Display')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Form method='POST'>
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('Display')}
                        </Typography>
                        {!isSubmitting && actionData?.isSaved && (
                            <Alert severity='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}
                        <FormGroup>
                            <TextField
                                name='DateAddedBehavior'
                                select
                                defaultValue={metadata?.UseFileCreationTimeForDateAdded ? '1' : '0'}
                                label={globalize.translate('LabelDateAddedBehavior')}
                                helperText={globalize.translate('LabelDateAddedBehaviorHelp')}
                            >
                                <MenuItem value='0'>{globalize.translate('OptionDateAddedImportTime')}</MenuItem>
                                <MenuItem value='1'>{globalize.translate('OptionDateAddedFileTime')}</MenuItem>
                            </TextField>
                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name='DisplayFolderView'
                                            defaultChecked={config?.EnableFolderView}
                                        />
                                    }
                                    label={globalize.translate('OptionDisplayFolderView')}
                                />
                                <FormHelperText>{globalize.translate('OptionDisplayFolderViewHelp')}</FormHelperText>
                            </FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name={'DisplaySpecialsWithinSeasons'}
                                        defaultChecked={config?.DisplaySpecialsWithinSeasons}
                                    />
                                }
                                label={globalize.translate('LabelDisplaySpecialsWithinSeasons')}
                            />
                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name='GroupMoviesIntoCollections'
                                            defaultChecked={config?.EnableGroupingIntoCollections}
                                        />
                                    }
                                    label={globalize.translate('LabelGroupMoviesIntoCollections')}
                                />
                                <FormHelperText>{globalize.translate('LabelGroupMoviesIntoCollectionsHelp')}</FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name='EnableExternalContentInSuggestions'
                                            defaultChecked={config?.EnableExternalContentInSuggestions}
                                        />
                                    }
                                    label={globalize.translate('OptionEnableExternalContentInSuggestions')}
                                />
                                <FormHelperText>{globalize.translate('OptionEnableExternalContentInSuggestionsHelp')}</FormHelperText>
                            </FormControl>
                        </FormGroup>
                        <Button
                            type='submit'
                            size='large'
                        >
                            {globalize.translate('Save')}
                        </Button>
                    </Stack>
                </Form>
            </Box>
        </Page>
    );
};
