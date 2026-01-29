/**
 * Loading View
 *
 * Inline loading indicator with framer-motion animations.
 */

import { motion } from 'motion/react';

import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, CircularProgress, Flex, Text } from 'ui-primitives';

interface LoadingViewProps {
    message?: string;
}

const spinKeyframes = {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
};

export function LoadingView({ message }: LoadingViewProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: 'easeOut' as const
            }
        }
    };

    const spinnerVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            rotate: 360,
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: 'linear' as const
            }
        }
    };

    return (
        <motion.div
            className="loadingView"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                gap: vars.spacing['3']
            }}
        >
            <motion.div
                className="loading-spinner"
                variants={spinnerVariants}
                animate="visible"
                style={{
                    width: 48,
                    height: 48,
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    borderTopColor: '#aa5eaa',
                    borderRadius: '50%'
                }}
            />
            <motion.div variants={itemVariants}>
                {message && (
                    <Text size="sm" color="secondary" style={{ color: '#b0b0b0' }}>
                        {message}
                    </Text>
                )}
            </motion.div>
        </motion.div>
    );
}

export default LoadingView;
