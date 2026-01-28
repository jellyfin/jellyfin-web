import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { CircularProgress } from 'ui-primitives';
import { Grid } from 'ui-primitives';
import { Card } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import globalize from 'lib/globalize';

const MusicSongsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [songsData, setSongsData] = useState<any[]>([]);

    useEffect(() => {
        const loadSongsData = async () => {
            try {
                setTimeout(() => {
                    setSongsData([
                        { id: 1, name: 'Recently Added Songs', count: 42 },
                        { id: 2, name: 'Top Played', count: 156 },
                        { id: 3, name: 'Recently Played', count: 89 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load songs data:', error);
                setIsLoading(false);
            }
        };

        loadSongsData();
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
                <CircularProgress size="lg" />
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Heading.H2 style={{ marginBottom: vars.spacing['6'] }}>{globalize.translate('Songs')}</Heading.H2>

            <Grid container spacing="md">
                {songsData.map(item => (
                    <Grid key={item.id} xs={12} sm={6} md={4} lg={3}>
                        <Card style={{ border: `1px solid ${vars.colors.divider}` }}>
                            <Box
                                style={{
                                    aspectRatio: '16/9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: vars.colors.surfaceHover
                                }}
                            >
                                <Text style={{ fontSize: vars.typography['9'].fontSize }}>🎵</Text>
                            </Box>
                            <Box style={{ padding: vars.spacing['5'] }}>
                                <Text size="lg" weight="bold">
                                    {item.name}
                                </Text>
                                <Text size="sm" color="secondary">
                                    {item.count} songs
                                </Text>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default MusicSongsPage;
