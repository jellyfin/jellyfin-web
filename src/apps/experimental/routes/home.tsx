import React, { FunctionComponent, useMemo } from 'react';

import '../../../elements/emby-tabs/emby-tabs';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-scroller/emby-scroller';
import { useGetDisplayPreferences, useGetUserViews } from 'hooks/useFetchItems';
import Page from 'components/Page';
import HomeSectionsView from '../components/library/HomeSectionsView';
import { HomeSectionType } from 'types/homeSectionType';
import Loading from 'components/loading/LoadingComponent';

const Home: FunctionComponent = () => {
    const { data: userViews, isLoading: isUserViewsLoading } = useGetUserViews();

    const { data: displayPreferences, isLoading: isDisplayPrefrencesLoading } = useGetDisplayPreferences({
        displayPreferencesId: 'usersettings',
        client: 'emby'
    });

    // Get the home sections from the display preferences
    const homeSections = useMemo(() =>
        Object.entries(displayPreferences?.CustomPrefs ?? {})
            .filter(([key]) => /^homesection\d$/.test(key))
            .map(([key, value]) => ({ [key.replace('homesection', '')]: value as string }))
            .sort()
            .map((value) => Object.values(value)[0])
            .filter(s => s !== 'none') as HomeSectionType[]
    , [displayPreferences?.CustomPrefs]);

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

            {homeSections.map((section) => (
                // eslint-disable-next-line react/jsx-no-useless-fragment
                <>
                    {userViews?.Items && <HomeSectionsView key={section} views={userViews?.Items} sectionType={section} />}
                </>
            ))}
        </Page>
    );
};

export default Home;
