import React, { useCallback, useState } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { type ActionData } from 'types/actionData';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import Loading from 'components/loading/LoadingComponent';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';
import { Alert } from 'ui-primitives/Alert';
import { Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Input } from 'ui-primitives/Input';
import { Text } from 'ui-primitives/Text';

export const Component = (): React.ReactElement => {
    const [ actionData, setActionData ] = useState<ActionData | undefined>();
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const { isPending: isConfigurationPending, data: config } = useConfiguration();

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const api = ServerConnections.getCurrentApi();
            if (!api) {
                throw new Error('No Api instance available');
            }

            const { data: currentConfig } = await getConfigurationApi(api).getConfiguration();
            const formData = new FormData(event.currentTarget);

            const minResumePercentage = formData.get('MinResumePercentage')?.toString();
            const maxResumePercentage = formData.get('MaxResumePercentage')?.toString();
            const minAudiobookResume = formData.get('MinAudiobookResume')?.toString();
            const maxAudiobookResume = formData.get('MaxAudiobookResume')?.toString();
            const minResumeDuration = formData.get('MinResumeDuration')?.toString();

            if (minResumePercentage) currentConfig.MinResumePct = parseInt(minResumePercentage, 10);
            if (maxResumePercentage) currentConfig.MaxResumePct = parseInt(maxResumePercentage, 10);
            if (minAudiobookResume) currentConfig.MinAudiobookResume = parseInt(minAudiobookResume, 10);
            if (maxAudiobookResume) currentConfig.MaxAudiobookResume = parseInt(maxAudiobookResume, 10);
            if (minResumeDuration) currentConfig.MinResumeDurationSeconds = parseInt(minResumeDuration, 10);

            await getConfigurationApi(api)
                .updateConfiguration({ serverConfiguration: currentConfig });

            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });

            setActionData({ isSaved: true });
        } catch (error) {
            setActionData({ isSaved: false });
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    if (isConfigurationPending) {
        return <Loading />;
    }

    return (
        <Page
            id='playbackConfigurationPage'
            title={globalize.translate('ButtonResume')}
            className='mainAnimatedPage type-interior'
        >
            <Flex className='content-primary' style={{ flexDirection: 'column', gap: '24px' }}>
                <form onSubmit={handleSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                        <Text as='h1' size='xl' weight='bold'>
                            {globalize.translate('ButtonResume')}
                        </Text>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert variant='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        <Input
                            label={globalize.translate('LabelMinResumePercentage')}
                            name='MinResumePercentage'
                            type='number'
                            defaultValue={config?.MinResumePct}
                            min={0}
                            max={100}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelMaxResumePercentage')}
                            name='MaxResumePercentage'
                            type='number'
                            defaultValue={config?.MaxResumePct}
                            min={1}
                            max={100}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelMinAudiobookResume')}
                            name='MinAudiobookResume'
                            type='number'
                            defaultValue={config?.MinAudiobookResume}
                            min={0}
                            max={100}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelMaxAudiobookResume')}
                            name='MaxAudiobookResume'
                            type='number'
                            defaultValue={config?.MaxAudiobookResume}
                            min={1}
                            max={100}
                            required
                        />

                        <Input
                            label={globalize.translate('LabelMinResumeDuration')}
                            name='MinResumeDuration'
                            type='number'
                            defaultValue={config?.MinResumeDurationSeconds}
                            min={0}
                            required
                        />

                        <Button type='submit'>
                            {globalize.translate('Save')}
                        </Button>
                    </Flex>
                </form>
            </Flex>
        </Page>
    );
};

Component.displayName = 'ResumePage';
