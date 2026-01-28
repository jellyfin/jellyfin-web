import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Heading } from 'ui-primitives/Text';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { Grid } from 'ui-primitives/Grid';
import { Card } from 'ui-primitives/Card';
import { vars } from 'styles/tokens.css';
import globalize from 'lib/globalize';

const LiveTVChannelsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Local News', count: 12 },
                        { id: 2, name: 'Sports Channel', count: 8 },
                        { id: 3, name: 'Movie Network', count: 15 }
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
            <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress size="lg" />
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Heading.H2 style={{ marginBottom: vars.spacing['6'] }}>{globalize.translate('Channels')}</Heading.H2>
            <Grid container spacing="md">
                {data.map(item => (
                    <Grid key={item.id} xs={12} sm={6} md={4} lg={3}>
                        <Card style={{ border: `1px solid ${vars.colors.divider}` }}>
                            <Box
                                style={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: vars.colors.surfaceHover
                                }}
                            >
                                <Text style={{ fontSize: vars.typography['9'].fontSize }}>📺</Text>
                            </Box>
                            <Box style={{ padding: vars.spacing['5'] }}>
                                <Text size="lg" weight="bold">
                                    {item.name}
                                </Text>
                                <Text size="sm" color="secondary">
                                    {item.count} programs
                                </Text>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default LiveTVChannelsPage;
