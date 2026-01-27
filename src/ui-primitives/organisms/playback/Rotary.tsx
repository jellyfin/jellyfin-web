import React, { forwardRef, type ReactElement, type ReactNode, type HTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { rotaryContainer, discArt, discGroove, discLabel, centerHole } from './styles.css';

export interface RotaryProps extends HTMLAttributes<HTMLDivElement> {
    readonly children?: ReactNode;
    readonly rotating?: boolean;
    readonly rotationSpeed?: number;
    readonly reverse?: boolean;
    readonly artSrc?: string;
    readonly state?: 'playing' | 'paused' | 'braking' | 'spinning' | 'idle';
    readonly scratching?: boolean;
    readonly size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Rotary = forwardRef<HTMLDivElement, RotaryProps>(
    (
        {
            children,
            rotating = false,
            rotationSpeed = 1,
            reverse = false,
            artSrc,
            state = 'idle',
            scratching = false,
            size = 'md',
            className,
            style,
            ...props
        },
        ref
    ): ReactElement => {
        const sizeMap = {
            sm: '48px',
            md: '64px',
            lg: '96px',
            xl: '128px'
        };

        const animationDuration = rotating ? `${2 / Math.abs(rotationSpeed)}s` : undefined;

        let scale = 1;
        if (state === 'paused') {
            scale = 0.95;
        } else if (state === 'spinning') {
            scale = 1.02;
        }

        return (
            <motion.div
                ref={ref}
                className={`${rotaryContainer} ${className ?? ''}`}
                style={{
                    width: sizeMap[size],
                    height: sizeMap[size],
                    ...style
                }}
                animate={{
                    rotate: rotating ? 360 : 0,
                    scale
                }}
                transition={{
                    rotate: {
                        duration: rotating ? 2 / Math.abs(rotationSpeed) : 0,
                        repeat: rotating ? Infinity : 0,
                        ease: 'linear'
                    },
                    scale: { duration: 0.2 }
                }}
                data-rotating={rotating}
                data-reverse={reverse}
                data-scratching={scratching}
                data-state={state}
                {...props}
            >
                {artSrc !== undefined && artSrc !== '' && (
                    <motion.img
                        src={artSrc}
                        alt="Album art"
                        className={discArt}
                        animate={{ rotate: rotating ? 360 : 0 }}
                        transition={{
                            duration: rotating ? 2 / Math.abs(rotationSpeed) : 0,
                            repeat: rotating ? Infinity : 0,
                            ease: 'linear'
                        }}
                        style={{ animationDuration }}
                    />
                )}
                {children}
                <div className={discGroove} />
                <div className={discLabel}>
                    <div className={centerHole} />
                </div>
            </motion.div>
        );
    }
);

Rotary.displayName = 'Rotary';
