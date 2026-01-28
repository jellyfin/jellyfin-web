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

import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import SimpleAlert from 'components/SimpleAlert';
import { QUERY_KEY, useNamedConfiguration } from 'hooks/useNamedConfiguration';
import { useUsers } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useState } from 'react';
import { type ActionData } from 'types/actionData';
import { queryClient } from 'utils/query/queryClient';
import type { XbmcMetadataOptions } from '@jellyfin/sdk/lib/generated-client/models/xbmc-metadata-options';
import { Alert } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { FormControl, FormControlLabel, FormHelperText } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';

const CONFIG_KEY = 'xbmcmetadata';

export const Component = (): React.ReactElement => {
    const {
        data: config,
        isPending: isConfigPending,
        isError: isConfigError
    } = useNamedConfiguration<XbmcMetadataOptions>(CONFIG_KEY);
    const { data: users, isPending: isUsersPending, isError: isUsersError } = useUsers();
    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const onAlertClose = useCallback(() => {
        setIsAlertOpen(false);
    }, []);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setIsAlertOpen(true);
        try {
            const api = ServerConnections.getCurrentApi();
            if (!api) {
                throw new Error('No Api instance available');
            }

            const formData = new FormData(event.currentTarget);
            const data = Object.fromEntries(formData);

            const newConfig: XbmcMetadataOptions = {
                UserId: data.UserId?.toString(),
                ReleaseDateFormat: 'yyyy-MM-dd',
                SaveImagePathsInNfo: data.SaveImagePathsInNfo?.toString() === 'on',
                EnablePathSubstitution: data.EnablePathSubstitution?.toString() === 'on',
                EnableExtraThumbsDuplication: data.EnableExtraThumbsDuplication?.toString() === 'on'
            };

            await getConfigurationApi(api).updateNamedConfiguration({ key: CONFIG_KEY, body: newConfig });

            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY, CONFIG_KEY]
            });

            setActionData({ isSaved: true });
        } catch (error) {
            setActionData({ isSaved: false });
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    if (isConfigPending || isUsersPending) {
        return <Loading />;
    }

    return (
        <Page
            id="metadataNfoPage"
            title={globalize.translate('TabNfoSettings')}
            className="type-interior mainAnimatedPage"
        >
            <SimpleAlert
                open={isAlertOpen}
                text={globalize.translate('MetadataSettingChangeHelp')}
                onClose={onAlertClose}
            />
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                {isConfigError || isUsersError ? (
                    <Alert variant="error">{globalize.translate('MetadataNfoLoadError')}</Alert>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                            {!isSubmitting && actionData?.isSaved && (
                                <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                            )}
                            <Text as="h1" size="xl" weight="bold">
                                {globalize.translate('TabNfoSettings')}
                            </Text>
                            <Text as="p">{globalize.translate('HeaderKodiMetadataHelp')}</Text>

                            <Select name="UserId" defaultValue={config.UserId || ''}>
                                <SelectTrigger style={{ width: '100%' }}>
                                    <SelectValue placeholder={globalize.translate('LabelKodiMetadataUser')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{globalize.translate('None')}</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.Id} value={user.Id || ''}>
                                            {user.Name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="SaveImagePathsInNfo"
                                            defaultChecked={config.SaveImagePathsInNfo}
                                        />
                                    }
                                    label={globalize.translate('LabelKodiMetadataSaveImagePaths')}
                                />
                                <FormHelperText>
                                    {globalize.translate('LabelKodiMetadataSaveImagePathsHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="EnablePathSubstitution"
                                            defaultChecked={config.EnablePathSubstitution}
                                        />
                                    }
                                    label={globalize.translate('LabelKodiMetadataEnablePathSubstitution')}
                                />
                                <FormHelperText>
                                    {globalize.translate('LabelKodiMetadataEnablePathSubstitutionHelp')}
                                </FormHelperText>
                            </FormControl>

                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="EnableExtraThumbsDuplication"
                                            defaultChecked={config.EnableExtraThumbsDuplication}
                                        />
                                    }
                                    label={globalize.translate('LabelKodiMetadataEnableExtraThumbs')}
                                />
                                <FormHelperText>
                                    {globalize.translate('LabelKodiMetadataEnableExtraThumbsHelp')}
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

Component.displayName = 'NFOSettingsPage';
