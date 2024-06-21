import React, { type FC, useMemo } from 'react';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useGetDisplayPreferences } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'scripts/globalize';
import HomeSectionsView from '../components/library/HomeSectionsView';
import type { HomeSectionType } from 'types/homeSectionType';

import 'elements/emby-button/emby-button.scss';
import 'components/homesections/homesections.scss';

const Home: FC = () => {
    const { user } = useApi();
    const { data: userViewsData, isLoading: isUserViewsLoading } = useUserViews(
        user?.Id
    );
    const userViews = userViewsData?.Items || [];

    const { data: displayPreferences, isLoading: isDisplayPrefrencesLoading } =
        useGetDisplayPreferences({
            displayPreferencesId: 'usersettings',
            client: 'emby'
        });

    // Get the home sections from the display preferences
    const homeSections = useMemo(
        () =>
            Object.entries(displayPreferences?.CustomPrefs ?? {})
                .filter(([key]) => /^homesection\d$/.test(key))
                .map(([key, value]) => ({
                    [key.replace('homesection', '')]: value as string
                }))
                .sort()
                .map((value) => Object.values(value)[0])
                .filter((s) => s !== 'none') as HomeSectionType[],
        [displayPreferences?.CustomPrefs]
    );

    if (isUserViewsLoading || isDisplayPrefrencesLoading) {
        return <Loading />;
    }

    return (
        <Page
            id='indexPage'
            className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage pageWithAbsoluteTabs withTabs'
            isBackButtonEnabled={false}
            backDropType='movie,series,book'
        >
            {!userViews?.length ? (
                <div className='noItemsMessage centerMessage'>
                    <h1>{globalize.translate('MessageNothingHere')}</h1>
                    {user?.Policy?.IsAdministrator ? (
                        <div>
                            <p>{globalize.translate('NoLibrariesCreated')}</p>
                            <a
                                href={'#/dashboard/libraries'}
                                className='emby-button button-link'
                            >
                                {globalize.translate(
                                    'LabelWouldYouLikeToCreate'
                                )}
                            </a>
                        </div>
                    ) : (
                        <p>{globalize.translate('AskAdminToCreateLibrary')}</p>
                    )}
                </div>
            ) : (
                homeSections.map((section, index) => (
                    <HomeSectionsView
                        // eslint-disable-next-line react/no-array-index-key
                        key={`homeSection-${section}-${index}`}
                        userViews={userViews}
                        sectionType={section}
                    />
                ))
            )}
        </Page>
    );
};

export default Home;
