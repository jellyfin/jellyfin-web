import { Button } from 'ui-primitives/Button';
import { Heading } from 'ui-primitives/Text';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';
import { Box } from 'ui-primitives/Box';

interface NoPluginResultsProps {
    isFiltered: boolean;
    onViewAll: () => void;
    query: string;
}

const NoPluginResults: FC<NoPluginResultsProps> = ({ isFiltered, onViewAll, query }): React.ReactElement => {
    const hasQuery = query != null && query !== '';

    return (
        <Box
            style={{
                textAlign: 'center',
                paddingTop: 64,
                paddingBottom: 64,
                paddingLeft: 16,
                paddingRight: 16,
                backgroundColor: 'var(--joy-palette-background-surface)',
                borderRadius: '8px',
                border: '1px dashed var(--joy-palette-divider)'
            }}
        >
            <Heading.H4 style={{ marginBottom: 8 }}>
                {hasQuery
                    ? globalize.translate('SearchResultsEmpty', query)
                    : globalize.translate('NoSubtitleSearchResultsFound')}
            </Heading.H4>

            {isFiltered && (
                <Button variant="plain" color="primary" onClick={onViewAll} style={{ marginTop: 8 }}>
                    {globalize.translate('ViewAllPlugins')}
                </Button>
            )}
        </Box>
    );
};

export default NoPluginResults;
