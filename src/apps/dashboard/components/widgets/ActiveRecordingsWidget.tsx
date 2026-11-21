import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import SectionContainer from 'components/common/SectionContainer';
import { CardShape } from 'components/cardbuilder/utils/shape';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { QUERY_KEY, useActiveRecordings } from 'apps/dashboard/features/livetv/api/useActiveRecordings';

const ActiveRecordingsWidget = () => {
    const { data: recordings, refetch } = useActiveRecordings();

    if (!recordings?.Items?.length) return null;

    return (
        <Widget
            title={globalize.translate('HeaderActiveRecordings')}
            href='/livetv?tab=4'
        >
            <SectionContainer
                noPadding
                itemsContainerProps={{
                    queryKey: [ QUERY_KEY ],
                    reloadItems: refetch
                }}
                items={recordings.Items}
                cardOptions={{
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
                }}
            />
        </Widget>
    );
};

export default ActiveRecordingsWidget;
