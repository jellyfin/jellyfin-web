/**
 * @deprecated This route uses legacy patterns (direct API calls, querySelector-style state).
 *
 * Migration:
 * - Use TanStack Query for data fetching
 * - Replace form state with TanStack Forms + Zod
 * - Use controlled components instead of direct DOM manipulation
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import React, { useCallback, useState } from 'react';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { QUERY_KEY as CONFIG_QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import { QUERY_KEY as NAMED_CONFIG_QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { type ActionData } from 'types/actionData';
import { queryClient } from 'utils/query/queryClient';
import type { MetadataConfiguration } from '@jellyfin/sdk/lib/generated-client/models/metadata-configuration';
import { Alert } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { FormControl, FormControlLabel, FormHelperText } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';

const CONFIG_KEY = 'metadata';

export const Component = (): React.ReactElement => {
    const { data: config, isPending: isConfigPending, isError: isConfigError } = useConfiguration();
    const {
        data: namedConfig,
        isPending: isNamedConfigPending,
        isError: isNamedConfigError
    } = useNamedConfiguration<MetadataConfiguration>(CONFIG_KEY);

    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const api = ServerConnections.getCurrentApi();
            if (!api) {
                throw new Error('No Api instance available');
            }

            const formData = new FormData(event.currentTarget);
            const data = Object.fromEntries(formData);

            const { data: config } = await getConfigurationApi(api).getConfiguration();

            const metadataConfig: MetadataConfiguration = {
                UseFileCreationTimeForDateAdded: data.DateAddedBehavior.toString() === '1'
            };

            config.EnableFolderView = data.DisplayFolderView?.toString() === 'on';
            config.DisplaySpecialsWithinSeasons = data.DisplaySpecialsWithinSeasons?.toString() === 'on';
            config.EnableGroupingMoviesIntoCollections = data.GroupMoviesIntoCollections?.toString() === 'on';
            config.EnableGroupingShowsIntoCollections = data.GroupShowsIntoCollections?.toString() === 'on';
            config.EnableExternalContentInSuggestions = data.EnableExternalContentInSuggestions?.toString() === 'on';

            await getConfigurationApi(api).updateConfiguration({ serverConfiguration: config });

            await getConfigurationApi(api).updateNamedConfiguration({ key: CONFIG_KEY, body: metadataConfig });

            void queryClient.invalidateQueries({
                queryKey: [CONFIG_QUERY_KEY]
            });
            void queryClient.invalidateQueries({
                queryKey: [NAMED_CONFIG_QUERY_KEY, CONFIG_KEY]
            });

            setActionData({ isSaved: true });
        } catch (error) {
            setActionData({ isSaved: false });
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    if (isConfigPending || isNamedConfigPending) {
        return <Loading />;
    }

    return (
        <Page id="libraryDisplayPage" title={globalize.translate('Display')} className="mainAnimatedPage type-interior">
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                {isConfigError || isNamedConfigError ? (
                    <Alert variant="error">{globalize.translate('DisplayLoadError')}</Alert>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                            {!isSubmitting && actionData?.isSaved && (
                                <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                            )}
                            <Text as="h1" size="xl" weight="bold">
                                {globalize.translate('Display')}
                            </Text>

                            <Select
                                name="DateAddedBehavior"
                                defaultValue={namedConfig.UseFileCreationTimeForDateAdded ? '1' : '0'}
                            >
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('LabelDateAddedBehavior')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">
                                        {globalize.translate('OptionDateAddedImportTime')}
                                    </SelectItem>
                                    <SelectItem value="1">{globalize.translate('OptionDateAddedFileTime')}</SelectItem>
                                </SelectContent>
                            </Select>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox name="DisplayFolderView" defaultChecked={config.EnableFolderView} />
                                    }
                                    label={globalize.translate('OptionDisplayFolderView')}
                                />
                                <FormHelperText>{globalize.translate('OptionDisplayFolderViewHelp')}</FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="DisplaySpecialsWithinSeasons"
                                            defaultChecked={config.DisplaySpecialsWithinSeasons}
                                        />
                                    }
                                    label={globalize.translate('LabelDisplaySpecialsWithinSeasons')}
                                />
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="GroupMoviesIntoCollections"
                                            defaultChecked={config.EnableGroupingMoviesIntoCollections}
                                        />
                                    }
                                    label={globalize.translate('LabelGroupMoviesIntoCollections')}
                                />
                                <FormHelperText>
                                    {globalize.translate('LabelGroupMoviesIntoCollectionsHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="GroupShowsIntoCollections"
                                            defaultChecked={config.EnableGroupingShowsIntoCollections}
                                        />
                                    }
                                    label={globalize.translate('LabelGroupShowsIntoCollections')}
                                />
                                <FormHelperText>
                                    {globalize.translate('LabelGroupShowsIntoCollectionsHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="EnableExternalContentInSuggestions"
                                            defaultChecked={config.EnableExternalContentInSuggestions}
                                        />
                                    }
                                    label={globalize.translate('OptionEnableExternalContentInSuggestions')}
                                />
                                <FormHelperText>
                                    {globalize.translate('OptionEnableExternalContentInSuggestionsHelp')}
                                </FormHelperText>
                            </FormControl>

                            <Button type="submit">{globalize.translate('Save')}</Button>
                        </Flex>
                    </form>
                )}
            </Flex>
        </Page>
    );
};

Component.displayName = 'DisplayPage';
