/**
 * Sort Menu
 *
 * Radix UI component for sort options with framer-motion animations.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Flex } from 'ui-primitives';
import { Text } from 'ui-primitives/Text';
import { List, ListItem } from 'ui-primitives/List';
import { RadioGroup, RadioGroupItem } from 'ui-primitives/RadioGroup';
import { Paper } from 'ui-primitives/Paper';

import { useSortStore } from 'store/sortStore';

interface SortMenuProps {
    open: boolean;
    onClose: () => void;
}

const SORT_OPTIONS = [
    { value: 'Name', label: 'Name' },
    { value: 'SortName', label: 'Sort Name' },
    { value: 'PremiereDate', label: 'Premiere Date' },
    { value: 'DateCreated', label: 'Date Added' },
    { value: 'PlayCount', label: 'Play Count' },
    { value: 'CommunityRating', label: 'Rating' },
    { value: 'Runtime', label: 'Runtime' }
];

export const SortMenu: React.FC<SortMenuProps> = ({ open, onClose }) => {
    const { sortBy, sortOrder, setSortBy, setSortOrder } = useSortStore();

    const menuVariants = {
        hidden: { opacity: 0, scale: 0.95, y: '-10px' },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.15,
                ease: 'easeOut' as const
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.1
            }
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={menuVariants}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 1000 }}
                >
                    <Paper
                        style={{
                            minWidth: 200,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            overflow: 'hidden',
                            backgroundColor: '#252525'
                        }}
                    >
                        <Box style={{ padding: '8px' }}>
                            <Text
                                size="xs"
                                color="secondary"
                                style={{ padding: '4px 8px', display: 'block', color: '#b0b0b0' }}
                            >
                                Sort By
                            </Text>
                            <RadioGroup value={sortBy} onValueChange={setSortBy}>
                                <List style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {SORT_OPTIONS.map(sort => (
                                        <ListItem key={sort.value} style={{ padding: 0 }}>
                                            <div
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor:
                                                        sortBy === sort.value
                                                            ? 'rgba(170, 94, 170, 0.2)'
                                                            : 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <RadioGroupItem
                                                    value={sort.value}
                                                    id={`sort-${sort.value}`}
                                                    label={sort.label}
                                                />
                                            </div>
                                        </ListItem>
                                    ))}
                                </List>
                            </RadioGroup>

                            <Box
                                style={{
                                    borderTop: '1px solid #404040',
                                    marginTop: '8px',
                                    paddingTop: '8px'
                                }}
                            >
                                <Text
                                    size="xs"
                                    color="secondary"
                                    style={{ padding: '4px 8px', display: 'block', color: '#b0b0b0' }}
                                >
                                    Order
                                </Text>
                                <RadioGroup
                                    value={sortOrder}
                                    onValueChange={val => setSortOrder(val as 'Ascending' | 'Descending')}
                                >
                                    <Flex style={{ flexDirection: 'row', gap: '16px', padding: '0 8px' }}>
                                        <RadioGroupItem value="Ascending" id="order-asc" label="Ascending" />
                                        <RadioGroupItem value="Descending" id="order-desc" label="Descending" />
                                    </Flex>
                                </RadioGroup>
                            </Box>
                        </Box>
                    </Paper>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SortMenu;
