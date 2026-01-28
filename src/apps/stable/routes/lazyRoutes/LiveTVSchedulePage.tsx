import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { CircularProgress } from 'ui-primitives';
import { Grid } from 'ui-primitives';
import { Card } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import globalize from 'lib/globalize';

const LiveTVSchedulePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Upcoming Tonight', count: 5 },
                        { id: 2, name: 'Tomorrow', count: 12 },
                        { id: 3, name: 'Next Week', count: 34 }
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
            <Heading.H2 style={{ marginBottom: vars.spacing['6'] }}>{globalize.translate('Schedule')}</Heading.H2>
            <Grid container spacing="md">
                {data.map(item => (
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
                                <Text style={{ fontSize: vars.typography['9'].fontSize }}>📅</Text>
                            </Box>
                            <Box style={{ padding: vars.spacing['5'] }}>
                                <Text size="lg" weight="bold">
                                    {item.name}
                                </Text>
                                <Text size="sm" color="secondary">
                                    {item.count} items
                                </Text>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default LiveTVSchedulePage;
