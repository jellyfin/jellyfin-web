import React, { type FC } from 'react';

import { useLocale } from 'hooks/useLocale';
import { toDecimalString } from 'utils/number';
import { Card } from 'ui-primitives/Card';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Skeleton } from 'ui-primitives/Skeleton';
import { vars } from 'styles/tokens.css';

interface Metric {
    label: string;
    value?: number;
}

export interface MetricCardProps {
    metrics: Metric[];
    Icon: React.ComponentType<{ style?: React.CSSProperties }>;
}

const MetricCard: FC<MetricCardProps> = ({ metrics, Icon }) => {
    const { dateTimeLocale } = useLocale();

    return (
        <Card
            style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                padding: vars.spacing['5'],
                transition: 'transform 0.2s'
            }}
        >
            <Flex
                style={{
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: vars.spacing['5']
                }}
            >
                <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['4'] }}>
                    {metrics.map(({ label, value }) => (
                        <Box key={label}>
                            <Text size="xs" color="secondary">
                                {label}
                            </Text>
                            <Text as="div" size="xl" weight="bold">
                                {typeof value !== 'undefined' ? (
                                    toDecimalString(value, dateTimeLocale)
                                ) : (
                                    <Skeleton variant="text" width={40} />
                                )}
                            </Text>
                        </Box>
                    ))}
                </Box>
                <Box style={{ color: vars.colors.primary, opacity: 0.8 }}>
                    <Icon style={{ fontSize: vars.typography['8'].fontSize }} />
                </Box>
            </Flex>
        </Card>
    );
};

export default MetricCard;
