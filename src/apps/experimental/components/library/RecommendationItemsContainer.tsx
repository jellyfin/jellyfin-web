import React, { FC } from 'react';
import { useGetMovieRecommendations } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'scripts/globalize';
import RecommendationContainer from './RecommendationContainer';
import { ParentId } from 'types/library';

interface RecommendationItemsContainerProps {
    parentId?: ParentId;
}

const RecommendationItemsContainer: FC<RecommendationItemsContainerProps> = ({
    parentId
}) => {
    const {
        isLoading,
        data: movieRecommendationsItems
    } = useGetMovieRecommendations(parentId);

    if (isLoading) return <Loading />;

    return (
        <>
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
                            key={`${recommendation.CategoryId}-${index}`} // use a unique id return value may have duplicate id
                            recommendation={recommendation}
                        />
                    );
                })
            )}
        </>
    );
};

export default RecommendationItemsContainer;
