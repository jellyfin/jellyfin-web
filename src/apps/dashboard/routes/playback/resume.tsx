import React from 'react';
import Page from '@/components/Page';
import globalize from '@/lib/globalize';
import { ServerConnections } from '@/lib/jellyfin-apiclient';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';
import { ActionData } from '@/types/actionData';
import { QUERY_KEY, useConfiguration } from '@/hooks/useConfiguration';
import Loading from '@/components/loading/LoadingComponent';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from '@/utils/query/queryClient';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const { data: config } = await getConfigurationApi(api).getConfiguration();
    const formData = await request.formData();

    const minResumePercentage = formData.get('MinResumePercentage')?.toString();
    const maxResumePercentage = formData.get('MaxResumePercentage')?.toString();
    const minAudiobookResume = formData.get('MinAudiobookResume')?.toString();
    const maxAudiobookResume = formData.get('MaxAudiobookResume')?.toString();
    const minResumeDuration = formData.get('MinResumeDuration')?.toString();

    if (minResumePercentage) config.MinResumePct = parseInt(minResumePercentage, 10);
    if (maxResumePercentage) config.MaxResumePct = parseInt(maxResumePercentage, 10);
    if (minAudiobookResume) config.MinAudiobookResume = parseInt(minAudiobookResume, 10);
    if (maxAudiobookResume) config.MaxAudiobookResume = parseInt(maxAudiobookResume, 10);
    if (minResumeDuration) config.MinResumeDurationSeconds = parseInt(minResumeDuration, 10);

    await getConfigurationApi(api)
        .updateConfiguration({ serverConfiguration: config });

    void queryClient.invalidateQueries({
        queryKey: [ QUERY_KEY ]
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

    if (isConfigurationPending) {
        return <Loading />;
    }

    return (
        <Page
            id='playbackConfigurationPage'
            title={globalize.translate('ButtonResume')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Form method='POST'>
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('ButtonResume')}
                        </Typography>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert severity='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        <TextField
                            label={globalize.translate('LabelMinResumePercentage')}
                            name='MinResumePercentage'
                            type='number'
                            defaultValue={config?.MinResumePct}
                            helperText={globalize.translate('LabelMinResumePercentageHelp')}
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    max: 100,
                                    required: true
                                }
                            }}
                        />

                        <TextField
                            label={globalize.translate('LabelMaxResumePercentage')}
                            name='MaxResumePercentage'
                            type='number'
                            defaultValue={config?.MaxResumePct}
                            helperText={globalize.translate('LabelMaxResumePercentageHelp')}
                            slotProps={{
                                htmlInput: {
                                    min: 1,
                                    max: 100,
                                    required: true
                                }
                            }}
                        />

                        <TextField
                            label={globalize.translate('LabelMinAudiobookResume')}
                            name='MinAudiobookResume'
                            type='number'
                            defaultValue={config?.MinAudiobookResume}
                            helperText={globalize.translate('LabelMinAudiobookResumeHelp')}
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    max: 100,
                                    required: true
                                }
                            }}
                        />

                        <TextField
                            label={globalize.translate('LabelMaxAudiobookResume')}
                            name='MaxAudiobookResume'
                            type='number'
                            defaultValue={config?.MaxAudiobookResume}
                            helperText={globalize.translate('LabelMaxAudiobookResumeHelp')}
                            slotProps={{
                                htmlInput: {
                                    min: 1,
                                    max: 100,
                                    required: true
                                }
                            }}
                        />

                        <TextField
                            label={globalize.translate('LabelMinResumeDuration')}
                            name='MinResumeDuration'
                            type='number'
                            defaultValue={config?.MinResumeDurationSeconds}
                            helperText={globalize.translate('LabelMinResumeDurationHelp')}
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    required: true
                                }
                            }}
                        />

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

Component.displayName = 'ResumePage';
