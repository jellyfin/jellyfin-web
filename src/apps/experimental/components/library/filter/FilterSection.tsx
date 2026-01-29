import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import React, { useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Flex, FlexCol, IconButton, Text } from 'ui-primitives';

interface FilterSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    collapsible?: boolean;
    onClear?: () => void;
    hasActiveFilters?: boolean;
}

export function FilterSection({
    title,
    icon,
    children,
    defaultExpanded = true,
    collapsible = true,
    onClear,
    hasActiveFilters = false
}: FilterSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultExpanded);

    return (
        <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
            <Flex
                style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--colors-divider)',
                    cursor: collapsible ? 'pointer' : 'default'
                }}
            >
                <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                    {icon && <span>{icon}</span>}
                    <Text weight="medium" size="sm" color="secondary">
                        {title}
                    </Text>
                </Flex>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['1'] }}>
                    {onClear && hasActiveFilters && (
                        <Box
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                        >
                            <Text size="xs" color="primary">
                                Clear
                            </Text>
                        </Box>
                    )}
                    {collapsible && (
                        <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(!isOpen);
                            }}
                            style={{
                                transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <ChevronDownIcon />
                        </IconButton>
                    )}
                </Flex>
            </Flex>
            <Collapsible.Content>
                <Box style={{ padding: '12px 0' }}>{children}</Box>
            </Collapsible.Content>
        </Collapsible.Root>
    );
}

export default FilterSection;
