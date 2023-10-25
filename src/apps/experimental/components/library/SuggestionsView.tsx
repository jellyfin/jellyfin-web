import React, { FC } from 'react';
import { Box } from '@mui/material';
import SuggestionsItemsContainer from './SuggestionsItemsContainer';
import RecommendationItemsContainer from './RecommendationItemsContainer';
import { ParentId } from 'types/library';
import { SectionsView } from 'types/suggestionsSections';

interface SuggestionsViewProps {
    parentId: ParentId;
    suggestionSectionViews: SectionsView[] | undefined;
    isMovieRecommendations: boolean | undefined;
}

const SuggestionsView: FC<SuggestionsViewProps> = ({
    parentId,
    suggestionSectionViews = [],
    isMovieRecommendations = false
}) => {
    return (
        <Box>
            <SuggestionsItemsContainer
                parentId={parentId}
                sectionsView={suggestionSectionViews}
            />

            {isMovieRecommendations && (
                <RecommendationItemsContainer parentId={parentId} />
            )}
        </Box>
    );
};

export default SuggestionsView;
