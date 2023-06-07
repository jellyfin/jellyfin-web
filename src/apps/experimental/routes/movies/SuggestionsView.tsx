import React, { FC } from 'react';
import { useGetMovieRecommendations } from 'hooks/useFetchItems';
import globalize from 'scripts/globalize';
import Loading from 'components/loading/LoadingComponent';
import RecommendationContainer from '../../components/library/RecommendationContainer';
import SuggestionsItemsContainer from '../../components/library/SuggestionsItemsContainer';

import { LibraryViewProps } from 'types/library';
import { SectionsView } from 'types/suggestionsSections';

const SuggestionsView: FC<LibraryViewProps> = ({ parentId }) => {
    const {
        isLoading,
        data: movieRecommendationsItems
    } = useGetMovieRecommendations(parentId);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <>
            <SuggestionsItemsContainer
                parentId={parentId}
                sectionsView={[SectionsView.ContinueWatchingMovies, SectionsView.LatestMovies]}
            />

            {!movieRecommendationsItems?.length ? (
                <div className='noItemsMessage centerMessage'>
                    <h1>{globalize.translate('MessageNothingHere')}</h1>
                    <p>
                        {globalize.translate(
                            'MessageNoMovieSuggestionsAvailable'
                        )}
                    </p>
                </div>
            ) : (
                movieRecommendationsItems.map((recommendation, index) => {
                    return (
                        <RecommendationContainer
                            // eslint-disable-next-line react/no-array-index-key
                            key={index} // use a unique id return value may have duplicate id
                            recommendation={recommendation}
                        />
                    );
                })
            )}
        </>
    );
};

export default SuggestionsView;
