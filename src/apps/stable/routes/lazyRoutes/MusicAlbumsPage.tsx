import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives/Box';
import { Card, CardBody } from 'ui-primitives/Card';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';
import globalize from 'lib/globalize';

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
                <CircularProgress size='md' />
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing.lg }}>
            <Text as='h1' size='xl' weight='bold' style={{ marginBottom: vars.spacing.md }}>
                {globalize.translate('Albums')}
            </Text>

            <Box
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: vars.spacing.lg
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
                            <Text size='lg' color='secondary'>
                                💿
                            </Text>
                        </Box>
                        <CardBody>
                            <Text weight='medium'>{item.name}</Text>
                            <Text size='sm' color='secondary'>{item.count} albums</Text>
                        </CardBody>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default MusicAlbumsPage;
