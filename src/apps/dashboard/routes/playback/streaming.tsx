import React, { useCallback, useState } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import Loading from 'components/loading/LoadingComponent';
import { type ActionData } from 'types/actionData';
import { queryClient } from 'utils/query/queryClient';
import { Alert } from 'ui-primitives/Alert';
import { Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Input } from 'ui-primitives/Input';
import { Text } from 'ui-primitives/Text';

export const Component = (): React.ReactElement => {
    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { isPending: isConfigurationPending, data: defaultConfiguration } = useConfiguration();

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const api = ServerConnections.getCurrentApi();
            if (!api) {
                throw new Error('No Api instance available');
            }

            const { data: config } = await getConfigurationApi(api).getConfiguration();
            const formData = new FormData(event.currentTarget);

            const bitrateLimit = formData.get('StreamingBitrateLimit')?.toString();
            config.RemoteClientBitrateLimit = Math.trunc(1e6 * parseFloat(bitrateLimit || '0'));

            await getConfigurationApi(api).updateConfiguration({ serverConfiguration: config });

            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY]
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
            id="streamingSettingsPage"
            title={globalize.translate('TabStreaming')}
            className="mainAnimatedPage type-interior"
        >
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                <form onSubmit={handleSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                        <Text as="h1" size="xl" weight="bold">
                            {globalize.translate('TabStreaming')}
                        </Text>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                        )}

                        <Input
                            type="number"
                            inputMode="decimal"
                            name="StreamingBitrateLimit"
                            label={globalize.translate('LabelRemoteClientBitrateLimit')}
                            defaultValue={
                                defaultConfiguration?.RemoteClientBitrateLimit
                                    ? defaultConfiguration?.RemoteClientBitrateLimit / 1e6
                                    : ''
                            }
                            min={0}
                            step={0.25}
                        />

                        <Button type="submit">{globalize.translate('Save')}</Button>
                    </Flex>
                </form>
            </Flex>
        </Page>
    );
};

Component.displayName = 'StreamingPage';
