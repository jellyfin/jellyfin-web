import type { CollectionType } from '@jellyfin/sdk/lib/generated-client';
import React, { useRef, type FC } from 'react';
import Box from '@mui/material/Box';
import classNames from 'classnames';
import { useSearchParams } from 'react-router-dom';
import { useApi } from 'hooks/useApi';
import { useGetDetailsItem } from 'apps/experimental/features/details/hooks/api/useGetDetailsItem';

import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';

import { TrackSelectionsProvider } from 'apps/experimental/features/details/hooks/useTrackSelections';
import DetailsBanner from 'apps/experimental/features/details/components/DetailBanner';
import DetailLogo from 'apps/experimental/features/details/components/DetailLogo';
import DetailPrimaryContainer from 'apps/experimental/features/details/components/DetailPrimaryContainer';
import DetailSecondaryContainer from 'apps/experimental/features/details/components/DetailSecondaryContainer';

import './details.scss';

const Details: FC = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const seriesTimerId = searchParams.get('seriesTimerId');
    const context = searchParams.get('context') as CollectionType;

    const { user } = useApi();
    const detailContainerRef = useRef<HTMLDivElement>(null);

    const {
        isLoading,
        isFetching,
        isSuccess,
        data: item
    } = useGetDetailsItem({
        urlParams: {
            id,
            seriesTimerId
        }
    });

    if (isLoading || isFetching) {
        return <Loading />;
    }

    return (
        <Page
            id='detailPage'
            className={classNames(
                'mainAnimatedPage libraryPage itemDetailPage noSecondaryNavPage selfBackdropPage'
            )}
            isBackButtonEnabled={true}
            title={item?.Name || ''}
        >
            {isSuccess && item && (
                <Box ref={detailContainerRef} className='detail-container'>
                    <DetailsBanner item={item} detailContainerRef={detailContainerRef} />
                    <DetailLogo item={item} />
                    <TrackSelectionsProvider key={id} item={item} paramId={id}>
                        <Box className='detailPageWrapperContainer'>
                            <DetailPrimaryContainer item={item} paramId={id} />
                            <Box className='detailPageSecondaryContainer padded-bottom-page'>
                                <Box className='detailPageContent'>
                                    <DetailSecondaryContainer
                                        item={item}
                                        context={context}
                                        user={user}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </TrackSelectionsProvider>
                </Box>
            )}
        </Page>
    );
};

export default Details;
