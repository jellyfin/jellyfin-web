import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import ItemsScroller from 'components/common/ItemsScroller';
import { setCardData } from 'components/cardbuilder/cardBuilder';
import { CardShape } from 'components/cardbuilder/utils/shape';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { CardOptions } from 'types/cardOptions';
import { QUERY_KEY, useActiveRecordings } from 'apps/dashboard/features/livetv/api/useActiveRecordings';

const ActiveRecordingsWidget = () => {
    const { data: recordings, refetch } = useActiveRecordings();
    const items = recordings?.Items;

    const cardOptions = useMemo<CardOptions>(() => {
        const options: CardOptions = {
            queryKey: [ QUERY_KEY ],
            shape: CardShape.AutoOverflow,
            defaultShape: CardShape.BackdropOverflow,
            showParentTitleOrTitle: true,
            showTitle: true,
            showAirTime: true,
            showAirEndTime: true,
            showChannelName: true,
            coverImage: true,
            overlayText: false,
            overlayMoreButton: true,
            cardLayout: false,
            centerText: true,
            preferThumb: 'auto',
            serverId: ServerConnections.currentApiClient()?.serverId()
        };
        setCardData(items ?? [], options);
        return options;
    }, [ items ]);

    if (!items?.length) return null;

    return (
        <Widget
            title={globalize.translate('HeaderActiveRecordings')}
            href='/livetv?tab=4'
        >
            <ItemsContainer
                queryKey={[ QUERY_KEY ]}
                reloadItems={refetch}
            >
                <ItemsScroller
                    cardOptions={cardOptions}
                    items={items}
                />
            </ItemsContainer>
        </Widget>
    );
};

export default ActiveRecordingsWidget;
