import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { shouldAllowTrackSelection, TrackSelections } from './track-selections';
import RecordingFieldsContainer from './RecordingFieldsContainer';
import { ItemMetadata } from './item-metadata';

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
    return (
        <Box className='detailPagePrimaryContent padded-right'>
            <Box className='detailSection'>
                {shouldAllowTrackSelection(item) && (
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
                </Box>

                <ItemMetadata
                    className='itemDetailsGroup'
                    item={item}
                    context={context}
                />
            </Box>
        </Box>
    );
};

export default DetailSecondaryContainer;
