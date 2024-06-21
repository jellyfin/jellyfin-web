import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC, useMemo } from 'react';
import { useApi } from 'hooks/useApi';
import { useGetHomeSectionsWithItems } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'scripts/globalize';
import { CardShape } from 'utils/card';
import LibraryButtonsSection from './LibraryButtonsSection';
import SectionContainer from './SectionContainer';
import { HomeSectionType } from 'types/homeSectionType';
import type { CardOptions } from 'types/cardOptions';

const getLatestMediaCardOptions = (userView: BaseItemDto | undefined) => {
    let shape;
    if (
        userView?.Type === BaseItemKind.Channel
        || userView?.CollectionType === CollectionType.Movies
        || userView?.CollectionType === CollectionType.Books
        || userView?.CollectionType === CollectionType.Tvshows
    ) {
        shape = CardShape.PortraitOverflow;
    } else if (
        userView?.CollectionType === CollectionType.Music
        || userView?.CollectionType === CollectionType.Homevideos
    ) {
        shape = CardShape.SquareOverflow;
    } else {
        shape = CardShape.BackdropOverflow;
    }

    const cardOptions: CardOptions = {
        shape: shape,
        preferThumb:
            userView?.CollectionType !== CollectionType.Movies
            && userView?.CollectionType !== CollectionType.Tvshows
            && userView?.Type !== BaseItemKind.Channel
            && userView?.CollectionType !== CollectionType.Music ?
                'auto' :
                null,
        showUnplayedIndicator: false,
        showChildCountIndicator: true,
        overlayText: false,
        centerText: true,
        overlayPlayButton: userView?.CollectionType !== CollectionType.Photos,
        cardLayout: false,
        showTitle: userView?.CollectionType !== CollectionType.Photos,
        showYear:
            userView?.CollectionType === CollectionType.Movies
            || userView?.CollectionType === CollectionType.Tvshows
            || !userView?.CollectionType,
        showParentTitle:
            userView?.CollectionType === CollectionType.Music
            || userView?.CollectionType === CollectionType.Tvshows
            || !userView?.CollectionType,
        lines: 2
    };

    return cardOptions;
};

const filterExcludedItems = (
    userViews: BaseItemDto[],
    userExcludeItems: string[]
) => {
    const excludeViewTypes: CollectionType[] = [
        CollectionType.Playlists,
        CollectionType.Livetv,
        CollectionType.Boxsets,
        CollectionType.Trailers,
        CollectionType.Folders,
        CollectionType.Unknown
    ];

    const excludeItemTypes: BaseItemKind[] = [BaseItemKind.Channel];

    return userViews.filter(
        (userView) =>
            userView.Id
            && !userExcludeItems.includes(userView.Id)
            && !(
                userView.CollectionType
                && excludeViewTypes.includes(userView.CollectionType)
            )
            && !(userView.Type && excludeItemTypes.includes(userView.Type))
    );
};

interface HomeSectionsViewProps {
    userViews: BaseItemDto[];
    view?: BaseItemDto;
    sectionType: HomeSectionType;
}

const HomeSectionsView: FC<HomeSectionsViewProps> = ({
    view,
    userViews,
    sectionType
}) => {
    const { user } = useApi();

    // Get user Exclude Items for latest media
    const userExcludeItems = useMemo(
        () => user?.Configuration?.LatestItemsExcludes ?? [],
        [user]
    );

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

    const { data: homeSectionsWithItems, isLoading } =
        useGetHomeSectionsWithItems(parentId, [sectionType], enabledQuery);

    if (isLoading) return <Loading />;

    /**
     * If the type is latestmedia we will recursively render this view
     * with additional props to know the collection type
     */
    if (sectionType === HomeSectionType.LatestMedia && !view) {
        const filteredViews = filterExcludedItems(userViews, userExcludeItems);
        return filteredViews?.map((v) => (
            <HomeSectionsView
                key={`${sectionType}-${v.Id}`}
                view={v}
                sectionType={sectionType}
                userViews={userViews}
            />
        ));
    }

    return (
        <div>
            {homeSectionsWithItems?.map(({ section, items }) =>
                section.type === HomeSectionType.LibraryButtons ? (
                    <LibraryButtonsSection
                        key={`section-${sectionType}`}
                        sectionTitle={globalize.translate(section.name)}
                        userViews={items}
                    />
                ) : (
                    <SectionContainer
                        key={`section-${sectionType}${view?.Id}`}
                        sectionTitle={
                            section.type === HomeSectionType.LatestMedia ?
                                globalize.translate(section.name, view?.Name) :
                                globalize.translate(section.name)
                        }
                        items={items}
                        cardOptions={
                            section.type === HomeSectionType.LatestMedia ?
                                getLatestMediaCardOptions(view) :
                                {
                                    showTitle: true,
                                    centerText: true,
                                    cardLayout: false,
                                    overlayText: false,
                                    ...section.cardOptions
                                }
                        }
                    />
                )
            )}
        </div>
    );
};

export default HomeSectionsView;
