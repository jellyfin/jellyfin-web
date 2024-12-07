import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useTrackSelections } from '../hooks/useTrackSelections';
import { getSeriesAirTime } from '../utils/items';

import TrackSelections from './TrackSelections';
import RecordingFieldsContainer from './RecordingFieldsContainer';
import ItemDetailLinks from './ItemDetailLinks';

import { ItemKind } from 'types/base/models/item-kind';
import type { ItemDto } from 'types/base/models/item-dto';

interface DetailSecondaryContainerProps {
    item: ItemDto;
    context?: CollectionType;
    user?: UserDto;
}

const DetailSecondaryContainer: FC<DetailSecondaryContainerProps> = ({
    item,
    context,
    user
}) => {
    const { isTrackSelectionAllowed } = useTrackSelections();

    const { Type, AirDays = [], AirTime, Status } = item;

    const seriesAirTimeText = useMemo(
        () => getSeriesAirTime(Type, AirDays, AirTime, Status),
        [AirDays, AirTime, Status, Type]
    );

    return (
        <Box className='detailPagePrimaryContent padded-right'>
            <Box className='detailSection'>
                {isTrackSelectionAllowed && (
                    <TrackSelections className='trackSelections' />
                )}

                {item.Id
                    && item.Type == ItemKind.Program
                    && user?.Policy?.EnableLiveTvManagement && (
                    <RecordingFieldsContainer
                        programId={item.Id}
                        serverId={item.ServerId}
                    />
                )}

                <Box mt={2} className='detailSectionContent'>
                    {item.Taglines && item.Taglines.length > 0 && (
                        <Typography
                            className='tagline'
                            variant='h3'
                            my={1}
                        >
                            {item.Taglines[0]}
                        </Typography>
                    )}

                    {item.Overview && (
                        <Typography className='overview' my={2}>
                            {item.Overview}
                        </Typography>
                    )}

                    {seriesAirTimeText && (
                        <Typography
                            className='seriesAirTime'
                            my={1}
                        >
                            {seriesAirTimeText}
                        </Typography>
                    )}
                </Box>

                <ItemDetailLinks
                    className='itemDetailsGroup'
                    item={item}
                    context={context}
                />
            </Box>
        </Box>
    );
};

export default DetailSecondaryContainer;
