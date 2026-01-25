import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives/Box';
import { Card, CardBody } from 'ui-primitives/Card';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';
import globalize from 'lib/globalize';

const LiveTVGuidePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Popular Guide', count: 45 },
                        { id: 2, name: 'Recently Added', count: 23 },
                        { id: 3, name: 'All Guide', count: 67 }
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
        <Box style={{ padding: vars.spacing.lg }}>
            <Text as="h2" size="xl" weight="bold" style={{ marginBottom: vars.spacing.lg }}>
                {globalize.translate('Guide')}
            </Text>
            <Box
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: vars.spacing.lg
                }}
            >
                {data.map(item => (
                    <Card key={item.id}>
                        <Box
                            style={{
                                aspectRatio: '16 / 9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: vars.colors.surfaceHover
                            }}
                        >
                            <Text size="xxl">📡</Text>
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

export default LiveTVGuidePage;
