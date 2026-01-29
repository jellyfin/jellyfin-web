import { motion } from 'motion/react';
import React from 'react';
import { splashLogoVariants } from '../styles/animations';

interface SplashLogoProps {
    className?: string;
}

export function SplashLogo({ className }: SplashLogoProps) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="visible"
            variants={splashLogoVariants}
            style={{
                width: '30%',
                height: '30%',
                backgroundImage: 'url("../node_modules/@jellyfin/ux-web/favicons/touchicon.png")',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
}
