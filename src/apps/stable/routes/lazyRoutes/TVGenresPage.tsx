import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives';
import { Card, CardBody } from 'ui-primitives';
import { CircularProgress } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import globalize from 'lib/globalize';

const TVGenresPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Popular T V Genres', count: 45 },
                        { id: 2, name: 'Recently Added', count: 23 },
                        { id: 3, name: 'Top Rated', count: 67 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load data:', error);
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <Box
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '200px'
                }}
            >
                <CircularProgress size="md" />
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['6'] }}>
            <Text as="h1" size="xl" weight="bold" style={{ marginBottom: vars.spacing['5'] }}>
                {globalize.translate('T V Genres')}
            </Text>
            <Box
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: vars.spacing['6']
                }}
            >
                {data.map(item => (
                    <Card key={item.id} style={{ height: '100%' }}>
                        <Box
                            style={{
                                height: 140,
                                backgroundColor: vars.colors.surfaceHover,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Text size="lg" color="secondary">
                                📺
                            </Text>
                        </Box>
                        <CardBody>
                            <Text weight="medium">{item.name}</Text>
                            <Text size="sm" color="secondary">
                                {item.count} items
                            </Text>
                        </CardBody>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default TVGenresPage;
