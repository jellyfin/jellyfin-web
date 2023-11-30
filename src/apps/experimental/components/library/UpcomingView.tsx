import React, { FC } from 'react';
import Box from '@mui/material/Box';
import { useGetGroupsUpcomingEpisodes } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'scripts/globalize';
import SectionContainer from './SectionContainer';
import { LibraryViewProps } from 'types/library';

const UpcomingView: FC<LibraryViewProps> = ({ parentId }) => {
    const { isLoading, data: groupsUpcomingEpisodes } = useGetGroupsUpcomingEpisodes(parentId);

    if (isLoading) return <Loading />;

    return (
        <Box>
            {!groupsUpcomingEpisodes?.length ? (
                <div className='noItemsMessage centerMessage'>
                    <h1>{globalize.translate('MessageNothingHere')}</h1>
                    <p>
                        {globalize.translate(
                            'MessagePleaseEnsureInternetMetadata'
                        )}
                    </p>
                </div>
            ) : (
                groupsUpcomingEpisodes?.map((group) => (
                    <SectionContainer
                        key={group.name}
                        sectionTitle={group.name}
                        items={group.items ?? []}
                        cardOptions={{
                            shape: 'overflowBackdrop',
                            showLocationTypeIndicator: false,
                            showParentTitle: true,
                            preferThumb: true,
                            lazy: true,
                            showDetailsMenu: true,
                            missingIndicator: false,
                            cardLayout: false
                        }}
                    />
                ))
            )}
        </Box>
    );
};

export default UpcomingView;
