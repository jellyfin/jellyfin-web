import type { CollectionType } from '@jellyfin/sdk/lib/generated-client';
import React from 'react';
import classNames from 'classnames';
import { useSearchParams } from 'react-router-dom';
import { useGetDetailsItem } from 'apps/experimental/features/details/api/useGetDetailsItem';

import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';
import { DetailView } from 'apps/experimental/features/details/view/detail-view';

export default function DetailsPage() {
    const [searchParams] = useSearchParams();
    const searchParamsId = searchParams.get('id');
    const searchParamsSeriesTimerId = searchParams.get('seriesTimerId');
    const context = searchParams.get('context') as CollectionType;

    const {
        isLoading,
        isFetching,
        isSuccess,
        data: item
    } = useGetDetailsItem({
        urlParams: {
            id: searchParamsId,
            seriesTimerId: searchParamsSeriesTimerId
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
                <DetailView item={item} paramId={searchParamsId} context={context} />
            )}
        </Page>
    );
}
