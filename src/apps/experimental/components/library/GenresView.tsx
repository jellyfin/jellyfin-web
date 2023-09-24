import React, { FC } from 'react';
import escapeHTML from 'escape-html';
import { useGetGroupsGenres } from 'hooks/useFetchItems';
import { appRouter } from 'components/router/appRouter';
import globalize from 'scripts/globalize';
import Loading from 'components/loading/LoadingComponent';
import SectionContainer from './SectionContainer';
import { CollectionType } from 'types/collectionType';
import { ParentId } from 'types/library';
import { useLibrarySettings } from 'hooks/useLibrarySettings';

interface GenresViewProps {
    collectionType?: CollectionType;
    parentId?: ParentId;
}

const GenresView: FC<GenresViewProps> = () => {
    const { item } = useLibrarySettings();
    const { isLoading, data: groupsGenres } = useGetGroupsGenres(item);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <>
            {!groupsGenres?.length ? (
                <div className='noItemsMessage centerMessage'>
                    <h1>{globalize.translate('MessageNothingHere')}</h1>
                    <p>{globalize.translate('MessageNoGenresAvailable')}</p>
                </div>
            ) : (
                groupsGenres.map(({ genre, items }) => (
                    <SectionContainer
                        key={genre.Id}
                        sectionTitle={escapeHTML(genre.Name)}
                        items={items ?? []}
                        url={appRouter.getRouteUrl(genre, {
                            context: item?.Type,
                            parentId: item?.Id
                        })}
                        cardOptions={{
                            scalable: true,
                            overlayPlayButton: true,
                            showTitle: true,
                            centerText: true,
                            cardLayout: false,
                            shape: item?.CollectionType === CollectionType.Music ? 'overflowSquare' : 'overflowPortrait',
                            showParentTitle: item?.CollectionType === CollectionType.Music,
                            showYear: item?.CollectionType !== CollectionType.Music
                        }}
                    />
                ))
            )}
        </>
    );
};

export default GenresView;
