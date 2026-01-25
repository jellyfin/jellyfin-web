import { motion, Variants, Easing } from 'framer-motion';

export const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: 'easeOut' as Easing
        }
    }
};

export const splashLogoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: 'easeOut' as Easing
        }
    }
};

export const headroomVariants: Variants = {
    unpinned: {
        y: '-100%',
        transition: {
            duration: 0.2,
            ease: 'linear' as Easing
        }
    },
    pinned: {
        y: '0%',
        transition: {
            duration: 0.2,
            ease: 'linear' as Easing
        }
    }
};

export const slideUpVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut' as Easing
        }
    }
};

export const slideDownVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut' as Easing
        }
    }
};

export const scaleVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as Easing
        }
    }
};

export const framerMotionWrapper: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

export const dialogScaleUp: Variants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as Easing
        }
    }
};

export const dialogScaleDown: Variants = {
    hidden: { opacity: 1, scale: 1 },
    visible: {
        opacity: 0,
        scale: 0.5,
        transition: {
            duration: 0.15,
            ease: 'easeIn' as Easing
        }
    }
};

export const dialogFadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as Easing
        }
    }
};

export const dialogFadeOut: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 0,
        transition: {
            duration: 0.15,
            ease: 'easeIn' as Easing
        }
    }
};

export const dialogSlideUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as Easing
        }
    }
};

export const dialogSlideDown: Variants = {
    hidden: { opacity: 1, y: 0 },
    visible: {
        opacity: 0,
        y: 20,
        transition: {
            duration: 0.15,
            ease: 'easeIn' as Easing
        }
    }
};

export { motion };
