import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Skeleton from '@mui/joy/Skeleton';
import Stack from '@mui/joy/Stack';
import SvgIcon from '@mui/joy/SvgIcon';
import Typography from '@mui/joy/Typography';
import React, { type FC } from 'react';

import { useLocale } from 'hooks/useLocale';
import { toDecimalString } from 'utils/number';

interface Metric {
    label: string
    value?: number
}

export interface MetricCardProps {
    metrics: Metric[]
    Icon: typeof SvgIcon
}

const MetricCard: FC<MetricCardProps> = ({
    metrics,
    Icon
}) => {
    const { dateTimeLocale } = useLocale();

    return (
        <Card
            variant="outlined"
            sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                p: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 'sm' }
            }}
        >
            <Stack
                direction='row'
                sx={{
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Stack spacing={1}>
                    {metrics.map(({ label, value }) => (
                        <Box key={label}>
                            <Typography
                                level='body-xs'
                                color='neutral'
                            >
                                {label}
                            </Typography>
                            <Typography
                                level='h4'
                                component='div'
                            >
                                {typeof value !== 'undefined' ? (
                                    toDecimalString(value, dateTimeLocale)
                                ) : (
                                    <Skeleton variant="text" width={40} />
                                )}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
                <Box sx={{ color: 'primary.plainColor', opacity: 0.8 }}>
                    <Icon sx={{ fontSize: '2.5rem' }} />
                </Box>
            </Stack>
        </Card>
    );
};

export default MetricCard;