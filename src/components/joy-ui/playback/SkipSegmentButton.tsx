import React, { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/joy/Typography/Typography';
import IconButton from '@mui/joy/IconButton';
import Button from '@mui/material/Button/Button';
import Fade from '@mui/material/Fade/Fade';
import Slide from '@mui/material/Slide/Slide';

import SkipNextIcon from '@mui/icons-material/SkipNext';

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
        <Slide direction="up" in={show} mountOnEnter unmountOnExit>
            <Box
                className="skip-button-container"
                sx={{
                    position: 'fixed',
                    bottom: 120,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <Fade in={show} timeout={300}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSkip}
                        startIcon={<SkipNextIcon />}
                        sx={{
                            borderRadius: 3,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: 3,
                            '&:hover': {
                                boxShadow: 4,
                                transform: 'scale(1.02)'
                            },
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        {segmentLabel}
                        {autoHide && hideAfter > 0 && (
                            <Typography
                                component="span"
                                sx={{
                                    ml: 1,
                                    opacity: 0.7,
                                    fontSize: '0.875rem',
                                    borderLeft: 1,
                                    borderColor: 'divider',
                                    pl: 1
                                }}
                            >
                                {countdown}
                            </Typography>
                        )}
                    </Button>
                </Fade>
            </Box>
        </Slide>
    );
};

export default SkipSegmentButton;
