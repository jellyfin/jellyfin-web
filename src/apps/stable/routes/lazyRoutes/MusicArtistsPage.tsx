import globalize from 'lib/globalize';
import React, { useEffect, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Card, CardBody, CircularProgress, Text } from 'ui-primitives';

/**
 * Lazy-loaded Music Artists Page
 */
const MusicArtistsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [artistsData, setArtistsData] = useState<any[]>([]);

    useEffect(() => {
        const loadArtistsData = async () => {
            try {
                setTimeout(() => {
                    setArtistsData([
                        { id: 1, name: 'Popular Artists', count: 45 },
                        { id: 2, name: 'Recently Added', count: 23 },
                        { id: 3, name: 'All Artists', count: 156 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load artists data:', error);
                setIsLoading(false);
            }
        };
        loadArtistsData();
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
                {globalize.translate('Artists')}
            </Text>

            <Box
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: vars.spacing['6']
                }}
            >
                {artistsData.map((item) => (
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
                                🎤
                            </Text>
                        </Box>
                        <CardBody>
                            <Text weight="medium">{item.name}</Text>
                            <Text size="sm" color="secondary">
                                {item.count} artists
                            </Text>
                        </CardBody>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default MusicArtistsPage;
