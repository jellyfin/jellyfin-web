import globalize from 'lib/globalize';
import React, { useEffect, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Card, CardBody, CircularProgress, Text } from 'ui-primitives';

/**
 * Lazy-loaded Music Albums Page
 */
const MusicAlbumsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [albumsData, setAlbumsData] = useState<any[]>([]);

    useEffect(() => {
        const loadAlbumsData = async () => {
            try {
                setTimeout(() => {
                    setAlbumsData([
                        { id: 1, name: 'Recently Added Albums', count: 24 },
                        { id: 2, name: 'Top Rated', count: 67 },
                        { id: 3, name: 'New Releases', count: 18 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load albums data:', error);
                setIsLoading(false);
            }
        };

        loadAlbumsData();
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
                {globalize.translate('Albums')}
            </Text>

            <Box
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: vars.spacing['6']
                }}
            >
                {albumsData.map((item) => (
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
                                💿
                            </Text>
                        </Box>
                        <CardBody>
                            <Text weight="medium">{item.name}</Text>
                            <Text size="sm" color="secondary">
                                {item.count} albums
                            </Text>
                        </CardBody>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default MusicAlbumsPage;
