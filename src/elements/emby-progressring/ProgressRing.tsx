import React from 'react';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { Text } from 'ui-primitives/Text';
import { Box } from 'ui-primitives/Box';
import { toPercentString } from 'utils/number';
import { getCurrentDateTimeLocale } from 'lib/globalize';
import { deprecate } from '../../utils/deprecation';
import './emby-progressring.scss';

interface ProgressRingProps {
    progress: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    thickness?: number;
    showText?: boolean;
}

const sizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
};

const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 'md',
    showText = true
}) => {
    deprecate('emby-progressring/ProgressRing', 'ui-primitives/CircularProgress', 'src/elements/emby-progressring/ProgressRing.tsx');

    const progressValue = Math.min(Math.max(progress, 0), 100);

    return (
        <Box style={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
                size={sizeMap[size] ?? 'md'}
            />
            {showText && (
                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Text size='xs'>
                        {toPercentString(progressValue / 100, getCurrentDateTimeLocale())}
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default ProgressRing;
