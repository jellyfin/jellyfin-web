import React, { type FC } from 'react';
import classNames from 'classnames';
import { useSearchParams } from 'react-router-dom';
import { useGetDetailsItem } from 'apps/experimental/features/details/hooks/api/useGetDetailsItem';
import { TrackSelectionsProvider } from 'apps/experimental/features/details/hooks/useTrackSelections';

import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';

import DetailsBanner from 'apps/experimental/features/details/components/DetailBanner';
import DetailPrimaryContainer from 'apps/experimental/features/details/components/DetailPrimaryContainer';
import DetailSecondaryContainer from 'apps/experimental/features/details/components/DetailSecondaryContainer';
import './details.scss';

const Details: FC = () => {
    const [searchParams] = useSearchParams();
    //const serverId = searchParams.get('serverId');
    const id = searchParams.get('id');
    const seriesTimerId = searchParams.get('seriesTimerId');
    const genre = searchParams.get('genre');
    const musicgenre = searchParams.get('musicgenre');
    const musicartist = searchParams.get('musicartist');
    const context = searchParams.get('context');

    const {
        isLoading,
        isSuccess,
        data: item,
        refetch
    } = useGetDetailsItem({
        urlParams: {
            id,
            seriesTimerId,
            genre,
            musicgenre,
            musicartist
        }
    });

    if (isLoading) {
        return <Loading />;
    }

    return (
        <Page
            id='detailPage'
            className={classNames(
                'mainAnimatedPage libraryPage itemDetailPage noSecondaryNavPage selfBackdropPage'
            )}
            isBackButtonEnabled={true}
        >
            {isSuccess && item && (
                <div className='detail-container'>
                    <DetailsBanner item={item} />
                    <TrackSelectionsProvider item={item}>
                        <div className='detailPageWrapperContainer'>
                            <DetailPrimaryContainer
                                item={item}
                                id={id}
                                reloadItems={refetch}
                            />
                            <div className='detailPageSecondaryContainer padded-bottom-page'>
                                <div className='detailPageContent'>
                                    <DetailSecondaryContainer
                                        item={item}
                                        id={id}
                                        context={context}
                                        reloadItems={refetch}
                                    />
                                </div>
                            </div>
                        </div>
                    </TrackSelectionsProvider>
                </div>
            )}
        </Page>
    );
};

export default Details;
