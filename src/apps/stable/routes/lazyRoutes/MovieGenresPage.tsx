import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives/Box';
import { Card, CardBody } from 'ui-primitives/Card';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';
import globalize from 'lib/globalize';

const MovieGenresPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [genresData, setGenresData] = useState<any[]>([]);

    useEffect(() => {
        const loadGenresData = async () => {
            try {
                setTimeout(() => {
                    setGenresData([
                        { id: 1, name: 'Action', count: 45 },
                        { id: 2, name: 'Comedy', count: 67 },
                        { id: 3, name: 'Drama', count: 34 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load genres data:', error);
                setIsLoading(false);
            }
        };
        loadGenresData();
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
        <Box style={{ padding: vars.spacing.lg }}>
            <Text as="h1" size="xl" weight="bold" style={{ marginBottom: vars.spacing.md }}>
                {globalize.translate('MovieGenres')}
            </Text>
            <Box
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: vars.spacing.lg
                }}
            >
                {genresData.map(item => (
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
                                🎭
                            </Text>
                        </Box>
                        <CardBody>
                            <Text weight="medium">{item.name}</Text>
                            <Text size="sm" color="secondary">
                                {item.count} movies
                            </Text>
                        </CardBody>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default MovieGenresPage;
