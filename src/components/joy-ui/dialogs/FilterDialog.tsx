/**
 * Filter Dialog
 *
 * Radix UI modal dialog for filtering media items with framer-motion animations.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Box, Flex } from 'ui-primitives';
import { Button } from 'ui-primitives/Button';
import { Text } from 'ui-primitives/Text';
import { Chip } from 'ui-primitives/Chip';
import { RadioGroup, RadioGroupItem } from 'ui-primitives/RadioGroup';
import { Divider } from 'ui-primitives/Divider';

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
    availableStudios = [],
}) => {
    const {
        genres,
        years,
        studios,
        genresMode,
        setGenres,
        setYears,
        setStudios,
        setGenresMode,
        clearFilters,
    } = useFilterStore();

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
        setLocalGenres((prev) =>
            prev.includes(genre)
                ? prev.filter((g) => g !== genre)
                : [...prev, genre]
        );
    };

    const toggleYear = (year: number) => {
        setLocalYears((prev) =>
            prev.includes(year)
                ? prev.filter((y) => y !== year)
                : [...prev, year]
        );
    };

    const toggleStudio = (studio: string) => {
        setLocalStudios((prev) =>
            prev.includes(studio)
                ? prev.filter((s) => s !== studio)
                : [...prev, studio]
        );
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const contentVariants = {
        hidden: { opacity: 0, scale: 0.95, y: '-48%' },
        visible: {
            opacity: 1,
            scale: 1,
            y: '-50%',
            transition: {
                duration: 0.2,
                ease: 'easeOut' as const,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.15,
            },
        },
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
                                    zIndex: 1000,
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
                                    backgroundColor: '#252525',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                                    position: 'fixed',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    maxWidth: '450px',
                                    width: '90%',
                                    maxHeight: '85vh',
                                    overflow: 'auto',
                                    padding: '24px',
                                    zIndex: 1001,
                                }}
                            >
                                <Text size="xl" style={{ fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>
                                    Filter Options
                                </Text>
                                <DialogPrimitive.Close asChild>
                                    <button
                                        style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#b0b0b0',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '6px',
                                        }}
                                        aria-label="Close"
                                    >
                                        ✕
                                    </button>
                                </DialogPrimitive.Close>

                                <Box style={{ paddingTop: '8px' }}>
                                    <Text size="sm" style={{ fontWeight: 500, marginBottom: '8px', color: '#ffffff' }}>
                                        Genre Match
                                    </Text>
                                    <RadioGroup value={localGenresMode} onValueChange={(val) => setLocalGenresMode(val as 'and' | 'or')}>
                                        <Flex style={{ gap: '16px' }}>
                                            <RadioGroupItem value="and" id="genre-and" label="All (AND)" />
                                            <RadioGroupItem value="or" id="genre-or" label="Any (OR)" />
                                        </Flex>
                                    </RadioGroup>
                                </Box>

                                <Divider style={{ margin: '16px 0', borderColor: '#404040' }} />

                                {availableGenres.length > 0 && (
                                    <Box style={{ marginBottom: '16px' }}>
                                        <Text size="sm" color="secondary" style={{ marginBottom: '8px', color: '#b0b0b0' }}>
                                            Genres
                                        </Text>
                                        <Flex style={{ flexWrap: 'wrap', gap: '4px' }}>
                                            {availableGenres.slice(0, 10).map((genre) => (
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
                                    <Box style={{ marginBottom: '16px' }}>
                                        <Text size="sm" color="secondary" style={{ marginBottom: '8px', color: '#b0b0b0' }}>
                                            Years
                                        </Text>
                                        <Flex style={{ flexWrap: 'wrap', gap: '4px' }}>
                                            {availableYears.slice(0, 10).map((year) => (
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
                                    <Box style={{ marginBottom: '16px' }}>
                                        <Text size="sm" color="secondary" style={{ marginBottom: '8px', color: '#b0b0b0' }}>
                                            Studios
                                        </Text>
                                        <Flex style={{ flexWrap: 'wrap', gap: '4px' }}>
                                            {availableStudios.slice(0, 10).map((studio) => (
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

                                <Divider style={{ margin: '16px 0', borderColor: '#404040' }} />

                                <Box style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                                    <Button variant="ghost" onClick={handleClear}>
                                        Clear All
                                    </Button>
                                    <Flex style={{ gap: '8px' }}>
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
