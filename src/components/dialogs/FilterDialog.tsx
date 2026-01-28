/**
 * Filter Dialog
 *
 * Radix UI modal dialog for filtering media items with framer-motion animations.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Box, Flex } from 'ui-primitives';
import { Button } from 'ui-primitives/Button';
import { Text } from 'ui-primitives/Text';
import { Chip } from 'ui-primitives/Chip';
import { RadioGroup, RadioGroupItem } from 'ui-primitives/RadioGroup';
import { Divider } from 'ui-primitives/Divider';
import { vars } from '../../styles/tokens.css';

import { useFilterStore } from 'store/filterStore';

interface FilterDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    availableGenres?: string[];
    availableYears?: number[];
    availableStudios?: string[];
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
    open,
    onClose,
    onApply,
    availableGenres = [],
    availableYears = [],
    availableStudios = []
}) => {
    const { genres, years, studios, genresMode, setGenres, setYears, setStudios, setGenresMode, clearFilters } =
        useFilterStore();

    const [localGenres, setLocalGenres] = useState(genres);
    const [localYears, setLocalYears] = useState(years);
    const [localStudios, setLocalStudios] = useState(studios);
    const [localGenresMode, setLocalGenresMode] = useState(genresMode);

    const handleApply = () => {
        setGenres(localGenres);
        setYears(localYears);
        setStudios(localStudios);
        setGenresMode(localGenresMode);
        onApply();
    };

    const handleClear = () => {
        setLocalGenres([]);
        setLocalYears([]);
        setLocalStudios([]);
        setLocalGenresMode('and');
        clearFilters();
    };

    const toggleGenre = (genre: string) => {
        setLocalGenres(prev => (prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]));
    };

    const toggleYear = (year: number) => {
        setLocalYears(prev => (prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]));
    };

    const toggleStudio = (studio: string) => {
        setLocalStudios(prev => (prev.includes(studio) ? prev.filter(s => s !== studio) : [...prev, studio]));
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const contentVariants = {
        hidden: { opacity: 0, scale: 0.95, y: '-48%' },
        visible: {
            opacity: 1,
            scale: 1,
            y: '-50%',
            transition: {
                duration: 0.2,
                ease: 'easeOut' as const
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.15
            }
        }
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={isOpen => !isOpen && onClose()}>
            <AnimatePresence>
                {open && (
                    <DialogPrimitive.Portal>
                        <DialogPrimitive.Overlay asChild>
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={overlayVariants}
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 1000
                                }}
                            />
                        </DialogPrimitive.Overlay>
                        <DialogPrimitive.Content asChild>
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={contentVariants}
                                style={{
                                    backgroundColor: vars.colors.surface,
                                    borderRadius: vars.borderRadius.lg,
                                    boxShadow: vars.shadows.lg,
                                    position: 'fixed',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    maxWidth: '450px',
                                    width: '90%',
                                    maxHeight: '85vh',
                                    overflow: 'auto',
                                    padding: vars.spacing['5'],
                                    zIndex: 1001
                                }}
                            >
                                <Text size="xl" style={{ fontWeight: 600, marginBottom: vars.spacing['4'], color: vars.colors.text }}>
                                    Filter Options
                                </Text>
                                <DialogPrimitive.Close asChild>
                                    <button
                                        style={{
                                            position: 'absolute',
                                            top: vars.spacing['4'],
                                            right: vars.spacing['4'],
                                            background: 'none',
                                            border: 'none',
                                            color: vars.colors.textSecondary,
                                            cursor: 'pointer',
                                            padding: vars.spacing['2'],
                                            borderRadius: vars.borderRadius.sm
                                        }}
                                        aria-label="Close"
                                    >
                                        ✕
                                    </button>
                                </DialogPrimitive.Close>

                                <Box style={{ paddingTop: vars.spacing['2'] }}>
                                    <Text size="sm" style={{ fontWeight: 500, marginBottom: vars.spacing['2'], color: vars.colors.text }}>
                                        Genre Match
                                    </Text>
                                    <RadioGroup
                                        value={localGenresMode}
                                        onValueChange={val => setLocalGenresMode(val as 'and' | 'or')}
                                    >
                                        <Flex style={{ gap: vars.spacing['4'] }}>
                                            <RadioGroupItem value="and" id="genre-and" label="All (AND)" />
                                            <RadioGroupItem value="or" id="genre-or" label="Any (OR)" />
                                        </Flex>
                                    </RadioGroup>
                                </Box>

                                <Divider style={{ margin: `${vars.spacing['4']} 0`, borderColor: vars.colors.divider }} />

                                {availableGenres.length > 0 && (
                                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                                        <Text
                                            size="sm"
                                            color="secondary"
                                            style={{ marginBottom: vars.spacing['2'], color: vars.colors.textSecondary }}
                                        >
                                            Genres
                                        </Text>
                                        <Flex style={{ flexWrap: 'wrap', gap: vars.spacing['1'] }}>
                                            {availableGenres.slice(0, 10).map(genre => (
                                                <Chip
                                                    key={genre}
                                                    variant={localGenres.includes(genre) ? 'primary' : 'neutral'}
                                                    onClick={() => toggleGenre(genre)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {genre}
                                                </Chip>
                                            ))}
                                        </Flex>
                                    </Box>
                                )}

                                {availableYears.length > 0 && (
                                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                                        <Text
                                            size="sm"
                                            color="secondary"
                                            style={{ marginBottom: vars.spacing['2'], color: vars.colors.textSecondary }}
                                        >
                                            Years
                                        </Text>
                                        <Flex style={{ flexWrap: 'wrap', gap: vars.spacing['1'] }}>
                                            {availableYears.slice(0, 10).map(year => (
                                                <Chip
                                                    key={year}
                                                    variant={localYears.includes(year) ? 'primary' : 'neutral'}
                                                    onClick={() => toggleYear(year)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {year}
                                                </Chip>
                                            ))}
                                        </Flex>
                                    </Box>
                                )}

                                {availableStudios.length > 0 && (
                                    <Box style={{ marginBottom: vars.spacing['4'] }}>
                                        <Text
                                            size="sm"
                                            color="secondary"
                                            style={{ marginBottom: vars.spacing['2'], color: vars.colors.textSecondary }}
                                        >
                                            Studios
                                        </Text>
                                        <Flex style={{ flexWrap: 'wrap', gap: vars.spacing['1'] }}>
                                            {availableStudios.slice(0, 10).map(studio => (
                                                <Chip
                                                    key={studio}
                                                    variant={localStudios.includes(studio) ? 'primary' : 'neutral'}
                                                    onClick={() => toggleStudio(studio)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {studio}
                                                </Chip>
                                            ))}
                                        </Flex>
                                    </Box>
                                )}

                                <Divider style={{ margin: `${vars.spacing['4']} 0`, borderColor: vars.colors.divider }} />

                                <Box style={{ display: 'flex', justifyContent: 'space-between', marginTop: vars.spacing['4'] }}>
                                    <Button variant="ghost" onClick={handleClear}>
                                        Clear All
                                    </Button>
                                    <Flex style={{ gap: vars.spacing['2'] }}>
                                        <Button variant="ghost" onClick={onClose}>
                                            Cancel
                                        </Button>
                                        <Button variant="primary" onClick={handleApply}>
                                            Apply
                                        </Button>
                                    </Flex>
                                </Box>
                            </motion.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    );
};

export default FilterDialog;
