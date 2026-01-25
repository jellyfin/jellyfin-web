import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { vars } from 'styles/tokens.css';

import { TrackNextIcon } from '@radix-ui/react-icons';

export interface SkipSegmentButtonProps {
    segmentLabel: string;
    endTime?: number;
    onSkip: () => void;
    onDismiss?: () => void;
    autoHide?: boolean;
    hideAfter?: number;
    visible?: boolean;
}

export const SkipSegmentButton: React.FC<SkipSegmentButtonProps> = ({
    segmentLabel,
    endTime,
    onSkip,
    onDismiss,
    autoHide = true,
    hideAfter = 8000,
    visible = true
}) => {
    const [show, setShow] = useState(true);
    const [countdown, setCountdown] = useState(hideAfter / 1000);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const handleDismiss = useCallback(() => {
        clearTimers();
        setShow(false);
        if (onDismiss) {
            setTimeout(() => onDismiss(), 300);
        }
    }, [clearTimers, onDismiss]);

    const handleSkip = useCallback(() => {
        clearTimers();
        onSkip();
    }, [clearTimers, onSkip]);

    useEffect(() => {
        if (visible && autoHide && hideAfter > 0) {
            setCountdown(hideAfter / 1000);

            intervalRef.current = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);

            timeoutRef.current = setTimeout(() => {
                handleDismiss();
            }, hideAfter);
        }

        return () => {
            clearTimers();
        };
    }, [visible, autoHide, hideAfter, clearTimers, handleDismiss]);

    if (!visible) {
        return null;
    }

    return (
        <Box
            className="skip-button-container"
            style={{
                position: 'fixed',
                bottom: 120,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 16
            }}
        >
            <Button
                variant="primary"
                color="primary"
                onClick={handleSkip}
                startDecorator={<TrackNextIcon />}
                style={{
                    borderRadius: 24,
                    paddingLeft: 24,
                    paddingRight: 24,
                    paddingTop: 8,
                    paddingBottom: 8,
                    textTransform: 'none',
                    fontSize: vars.typography.fontSizeSm,
                    boxShadow: 'var(--joy-palette-shadow-3)',
                    transition: 'all 0.2s ease-in-out'
                }}
            >
                {segmentLabel}
                {autoHide && hideAfter > 0 && (
                    <Text
                        as="span"
                        style={{
                            marginLeft: 8,
                            opacity: 0.7,
                            fontSize: vars.typography.fontSizeSm,
                            borderLeft: '1px solid var(--joy-palette-divider)',
                            paddingLeft: 8
                        }}
                    >
                        {countdown}
                    </Text>
                )}
            </Button>
        </Box>
    );
};

export default SkipSegmentButton;
