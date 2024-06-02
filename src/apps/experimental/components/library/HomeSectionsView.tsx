import { useGetHomeSectionsWithItems } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import React, { FC, useMemo } from 'react';
import SectionContainer from './SectionContainer';
import globalize from 'scripts/globalize';
import { SectionType } from 'types/sections';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { HomeSectionType } from 'types/homeSectionType';
import escapeHTML from 'escape-html';
import { CardShape } from 'utils/card';

type HomeViewProps = {
    views: BaseItemDto[] | undefined;
    view?: BaseItemDto;
    sectionType: HomeSectionType;
};

const HomeSectionsView: FC<HomeViewProps> = ({
    view,
    views,
    sectionType
}) => {
    // Identify the section type for the query
    const sectionTypeQuery = useMemo(() => {
        if (sectionType === HomeSectionType.NextUp) {
            return [SectionType.NextUp];
        }

        if (sectionType === HomeSectionType.LatestMedia && view?.CollectionType === 'movies') {
            return [SectionType.LatestMovies];
        }

        if (sectionType === HomeSectionType.LatestMedia && view?.CollectionType === 'tvshows') {
            return [SectionType.LatestEpisode];
        }

        if (sectionType === HomeSectionType.Resume) {
            return [SectionType.ResumeItems];
        }

        return [];
    }, [sectionType, view?.CollectionType]);

    // Get the parent id for latest media
    const parentId = useMemo(() => {
        if (sectionType === HomeSectionType.LatestMedia) {
            return view?.Id;
        }

        return undefined;
    }, [sectionType, view?.Id]);

    const enabledQuery = useMemo(() => {
        return !(sectionType === HomeSectionType.LatestMedia && !view);
    }, [sectionType, view]);

    const { data: homeSections, isLoading } = useGetHomeSectionsWithItems(parentId, sectionTypeQuery, enabledQuery);

    if (isLoading) return <Loading />;

    /**
    * If the type is latestmedia we will recursively render this view
    * with additional props to know the collection type
    */
    if (sectionType === HomeSectionType.LatestMedia && !view) {
        return (
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <>
                {views?.map((v) => (
                    <HomeSectionsView key={`${sectionType} ${v.Id}`} view={v} sectionType={sectionType} views={views} />
                ))}
            </>
        );
    }

    // Only render movies and tv show collections from latest media
    // otherwise return null
    if (sectionType === HomeSectionType.LatestMedia && view?.CollectionType !== 'movies' && view?.CollectionType !== 'tvshows') {
        return null;
    }

    return (
        <>
            {homeSections?.map(({ section, items }) => (
                <SectionContainer
                    key={'sectionConatiner' + section.type + view?.Id}
                    sectionTitle={globalize.translate(section.name, escapeHTML(view?.Name))}
                    items={items ?? []}
                    cardOptions={{
                        ...section.cardOptions
                    }}
                />
            ))}
            {sectionType === HomeSectionType.SmallLibraryTiles && (
                <SectionContainer
                    key={'sectionConatiner' + sectionType + view?.Id}
                    sectionTitle={globalize.translate('HeaderMyMedia')}
                    items={views ?? []}
                    cardOptions={{
                        shape: CardShape.BackdropOverflow,
                        showTitle: true,
                        centerText: true,
                        overlayText: false,
                        lazy: true
                    }}
                />
            )}
            {/** TODO: Library buttons not added yet. Should make a component to handle it */}
            {sectionType === HomeSectionType.LibraryButtons && (
                <SectionContainer
                    key={'sectionConatiner' + sectionType + view?.Id}
                    sectionTitle={globalize.translate('HeaderMyMediaSmall')}
                    items={views ?? []}
                    cardOptions={{
                        shape: CardShape.BackdropOverflow,
                        showTitle: true,
                        centerText: true,
                        overlayText: false,
                        lazy: true
                    }}
                />
            )}
        </>
    );
};

export default HomeSectionsView;
