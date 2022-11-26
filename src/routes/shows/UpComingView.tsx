import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import ViewUpComingContainer from '../../components/common/ViewUpComingContainer';
import loading from '../../components/loading/loading';
import ServerConnections from '../../components/ServerConnections';
import globalize from '../../scripts/globalize';
import { LibraryViewProps } from '../../types/interface';

const UpComingView: FC<LibraryViewProps> = ({topParentId}) => {
    const [ upComingItems, setUpComingItems ] = useState<BaseItemDto[]>([]);
    const element = useRef<HTMLDivElement>(null);

    const fetchUpcoming = useCallback(() => {
        loading.show();

        const apiClient = ServerConnections.getApiClient(window.ApiClient.serverId());
        return apiClient.getJSON(
            apiClient.getUrl(
                'Shows/Upcoming',
                {
                    Limit: 48,
                    Fields: 'AirTime',
                    UserId: apiClient.getCurrentUserId(),
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                    EnableTotalRecordCount: false,
                    ParentId: topParentId
                }
            ));
    }, [topParentId]);

    const loadUpcoming = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        fetchUpcoming().then((result) => {
            setUpComingItems(result.Items || []);

            import('../../components/autoFocuser').then(({default: autoFocuser}) => {
                autoFocuser.autoFocus(page);
            });

            loading.hide();
        });
    }, [fetchUpcoming]);

    useEffect(() => {
        loadUpcoming();
    }, [loadUpcoming]);

    return (
        <div ref={element}>
            {
                !upComingItems.length ?
                    (
                        <div className='noItemsMessage centerMessage'>
                            <h1>{globalize.translate('MessageNothingHere')}</h1>
                            <p>{globalize.translate('MessagePleaseEnsureInternetMetadata')}</p>
                        </div>
                    ) : <ViewUpComingContainer
                        topParentId={topParentId}
                        items={upComingItems}
                    />
            }
        </div>
    );
};

export default UpComingView;
