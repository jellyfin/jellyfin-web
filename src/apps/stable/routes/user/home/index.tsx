import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'hooks/useSearchParams';
import { Box, Text } from 'ui-primitives';
import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';
import HomeScreenSettingsComponent from 'components/homeScreenSettings/HomeScreenSettingsComponent';
import { useApi } from 'hooks/useApi';
import { currentSettings } from 'scripts/settings/userSettings';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';
import * as userSettings from 'scripts/settings/userSettings';

const UserHomeSettingsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { user: currentUser } = useApi();
    const [userSettingsInstance] = useState(() => new userSettings.UserSettings());
    const [isLoading, setIsLoading] = useState(true);

    const userId = searchParams.get('userId') || currentUser?.Id;
    const serverId = typeof window !== 'undefined' ? (window as any).ApiClient?.serverId?.() : '';

    useEffect(() => {
        if (userId) {
            const apiClient = (window as any).ApiClient;
            if (apiClient) {
                userSettingsInstance.setUserInfo(userId, apiClient).then(() => {
                    setIsLoading(false);
                });
            } else {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [userId, userSettingsInstance]);

    if (isLoading || !userId) {
        return <Loading />;
    }

    const handleSave = () => {
        toast(globalize.translate('SettingsSaved'));
    };

    return (
        <Page
            id="homeScreenPreferencesPage"
            className="libraryPage userPreferencesPage noSecondaryNavPage mainAnimatedPage"
            title={globalize.translate('Home')}
            shouldAutoFocus
        >
            <div className="padded-left padded-right padded-bottom-page padded-top">
                <Box style={{ margin: '0 auto' }}>
                    <HomeScreenSettingsComponent isTv={false} />
                </Box>
            </div>
        </Page>
    );
};

export default UserHomeSettingsPage;
