import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
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
            sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%'
            }}
        >
            <Stack
                direction='row'
                sx={{
                    width: '100%',
                    padding: 2,
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                {metrics.map(({ label, value }) => (
                    <Box key={label}>
                        <Typography
                            variant='body2'
                            color='text.secondary'
                        >
                            {label}
                        </Typography>
                        <Typography
                            variant='h5'
                            component='div'
                        >
                            {typeof value !== 'undefined' ? (
                                toDecimalString(value, dateTimeLocale)
                            ) : (
                                <Skeleton />
                            )}
                        </Typography>
                    </Box>
                ))}
                <Icon fontSize='large' />
            </Stack>
        </Card>
    );
};

export default MetricCard;
