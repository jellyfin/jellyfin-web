import React, { type ChangeEvent, useCallback, useEffect, useState } from 'react';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { Alert } from 'ui-primitives/Alert';
import { Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Checkbox } from 'ui-primitives/Checkbox';
import { FormControlLabel } from 'ui-primitives/FormControl';
import { Input } from 'ui-primitives/Input';
import { Text } from 'ui-primitives/Text';
import { useServerLogs } from 'apps/dashboard/features/logs/api/useServerLogs';
import { useConfiguration } from 'hooks/useConfiguration';
import type { ServerConfiguration } from '@jellyfin/sdk/lib/generated-client/models/server-configuration';
import { type ActionData } from 'types/actionData';
import LogItemList from 'apps/dashboard/features/logs/components/LogItemList';

export const Component = (): React.ReactElement => {
    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { isPending: isLogEntriesPending, data: logs } = useServerLogs();
    const { isPending: isConfigurationPending, data: defaultConfiguration } = useConfiguration();
    const [loading, setLoading] = useState(true);
    const [configuration, setConfiguration] = useState<ServerConfiguration>({});

    useEffect(() => {
        if (!isConfigurationPending && defaultConfiguration) {
            setConfiguration(defaultConfiguration);
            setLoading(false);
        }
    }, [isConfigurationPending, defaultConfiguration]);

    const setLogWarningMessage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setConfiguration({
                ...configuration,
                EnableSlowResponseWarning: event.target.checked
            });
        },
        [configuration]
    );

    const onResponseTimeChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setConfiguration({
                ...configuration,
                SlowResponseThresholdMs: parseInt(event.target.value, 10)
            });
        },
        [configuration]
    );

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const api = ServerConnections.getCurrentApi();
            if (!api) {
                throw new Error('No Api instance available');
            }

            const formData = new FormData(event.currentTarget);
            const { data: config } = await getConfigurationApi(api).getConfiguration();

            const enableWarningMessage = formData.get('EnableWarningMessage');
            config.EnableSlowResponseWarning = enableWarningMessage === 'on';

            const responseTime = formData.get('SlowResponseTime');
            if (responseTime) {
                config.SlowResponseThresholdMs = parseInt(responseTime.toString(), 10);
            }

            await getConfigurationApi(api).updateConfiguration({ serverConfiguration: config });

            setActionData({ isSaved: true });
        } catch (error) {
            setActionData({ isSaved: false });
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    if (isLogEntriesPending || isConfigurationPending || loading || !logs) {
        return <Loading />;
    }

    return (
        <Page id="logPage" title={globalize.translate('TabLogs')} className="mainAnimatedPage type-interior">
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                <form onSubmit={handleSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                        <Text as="h1" size="xl" weight="bold">
                            {globalize.translate('TabLogs')}
                        </Text>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                        )}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={configuration?.EnableSlowResponseWarning}
                                    onChange={setLogWarningMessage}
                                    name={'EnableWarningMessage'}
                                />
                            }
                            label={globalize.translate('LabelSlowResponseEnabled')}
                        />

                        <Input
                            type="number"
                            name="SlowResponseTime"
                            label={globalize.translate('LabelSlowResponseTime')}
                            value={configuration?.SlowResponseThresholdMs}
                            disabled={!configuration?.EnableSlowResponseWarning}
                            onChange={onResponseTimeChange}
                        />

                        <Button type="submit">{globalize.translate('Save')}</Button>
                    </Flex>
                </form>
                <div className="serverLogs readOnlyContent" style={{ marginTop: '24px' }}>
                    <LogItemList logs={logs} />
                </div>
            </Flex>
        </Page>
    );
};

Component.displayName = 'LogsPage';
