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

import { type ImageResolution } from '@jellyfin/sdk/lib/generated-client/models/image-resolution';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { useCountries } from 'apps/dashboard/features/libraries/api/useCountries';
import { useCultures } from 'apps/dashboard/features/libraries/api/useCultures';
import { getImageResolutionOptions } from 'apps/dashboard/features/libraries/utils/metadataOptions';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useState } from 'react';
import { type ActionData } from 'types/actionData';
import { queryClient } from 'utils/query/queryClient';
import { Alert } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';

import { PageContainer } from 'components/layout/PageContainer';

export const Component = (): React.ReactElement => {
    const { data: config, isPending: isConfigPending, isError: isConfigError } = useConfiguration();
    const { data: cultures, isPending: isCulturesPending, isError: isCulturesError } = useCultures();
    const { data: countries, isPending: isCountriesPending, isError: isCountriesError } = useCountries();

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

            config.PreferredMetadataLanguage = data.Language.toString();
            config.MetadataCountryCode = data.Country.toString();
            config.DummyChapterDuration = parseInt(data.DummyChapterDuration.toString(), 10);
            config.ChapterImageResolution = data.ChapterImageResolution.toString() as ImageResolution;

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

    const imageResolutions = getImageResolutionOptions();

    if (isConfigPending || isCulturesPending || isCountriesPending) {
        return <Loading />;
    }

    return (
        <Page
            id="metadataImagesConfigurationPage"
            title={globalize.translate('LabelMetadata')}
            className="type-interior mainAnimatedPage"
        >
            <PageContainer>
                <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                    {isConfigError || isCulturesError || isCountriesError ? (
                        <Alert variant="error">{globalize.translate('MetadataImagesLoadError')}</Alert>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                                {!isSubmitting && actionData?.isSaved && (
                                    <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                                )}
                                <Text as="h2" size="lg" weight="bold">
                                    {globalize.translate('HeaderPreferredMetadataLanguage')}
                                </Text>
                                <Text as="p">{globalize.translate('DefaultMetadataLangaugeDescription')}</Text>

                                <Select name="Language" defaultValue={config.PreferredMetadataLanguage}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('LabelLanguage')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cultures.map(culture => (
                                            <SelectItem
                                                key={culture.TwoLetterISOLanguageName ?? ''}
                                                value={culture.TwoLetterISOLanguageName ?? ''}
                                            >
                                                {culture.DisplayName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select name="Country" defaultValue={config.MetadataCountryCode}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('LabelCountry')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map(country => (
                                            <SelectItem
                                                key={country.TwoLetterISORegionName || country.DisplayName}
                                                value={country.TwoLetterISORegionName || ''}
                                            >
                                                {country.DisplayName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Text as="h2" size="lg" weight="bold">
                                    {globalize.translate('HeaderDummyChapter')}
                                </Text>

                                <Input
                                    name="DummyChapterDuration"
                                    type="number"
                                    defaultValue={config.DummyChapterDuration}
                                    label={globalize.translate('LabelDummyChapterDuration')}
                                    min={0}
                                    required
                                />

                                <Select name="ChapterImageResolution" defaultValue={config.ChapterImageResolution}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('LabelChapterImageResolution')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {imageResolutions.map(resolution => (
                                            <SelectItem key={resolution.name} value={resolution.value}>
                                                {resolution.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button type="submit">{globalize.translate('Save')}</Button>
                            </Flex>
                        </form>
                    )}
                </Flex>
            </PageContainer>
        </Page>
    );
};

Component.displayName = 'MetadataImagesPage';
