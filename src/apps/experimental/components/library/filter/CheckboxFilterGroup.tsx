import { vars } from 'styles/tokens.css.ts';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FilterSection } from './FilterSection';
import { Checkbox } from 'ui-primitives';
import { Box, Flex, FlexCol } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { MinusIcon, PlusIcon } from '@radix-ui/react-icons';

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface CheckboxFilterGroupProps {
    title: string;
    icon?: React.ReactNode;
    fetchOptions: () => Promise<FilterOption[]>;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    showCounts?: boolean;
    maxVisible?: number;
    collapsible?: boolean;
    defaultExpanded?: boolean;
}

export function CheckboxFilterGroup({
    title,
    icon,
    fetchOptions,
    selectedValues,
    onChange,
    showCounts = true,
    maxVisible = 5,
    collapsible = true,
    defaultExpanded = true
}: CheckboxFilterGroupProps) {
    const [showAll, setShowAll] = useState(false);

    const {
        data: options,
        isLoading,
        error
    } = useQuery({
        queryKey: ['filterOptions', title],
        queryFn: fetchOptions,
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    });

    const visibleOptions = showAll ? options : options?.slice(0, maxVisible);

    const handleToggle = (value: string) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
    };

    const handleClear = () => {
        onChange([]);
    };

    const hasActiveFilters = selectedValues.length > 0;

    return (
        <FilterSection
            title={title}
            icon={icon}
            collapsible={collapsible}
            defaultExpanded={defaultExpanded}
            onClear={hasActiveFilters ? handleClear : undefined}
            hasActiveFilters={hasActiveFilters}
        >
            {isLoading ? (
                <FlexCol style={{ gap: vars.spacing['2'] }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Box
                            key={i}
                            style={{
                                height: '24px',
                                backgroundColor: 'var(--colors-surfaceHover)',
                                borderRadius: '4px'
                            }}
                        />
                    ))}
                </FlexCol>
            ) : error ? (
                <Text size="sm" color="error">
                    Failed to load options
                </Text>
            ) : (
                <FlexCol style={{ gap: vars.spacing['2'] }}>
                    {visibleOptions?.map(option => (
                        <Checkbox
                            key={option.value}
                            checked={selectedValues.includes(option.value)}
                            onChangeChecked={() => handleToggle(option.value)}
                        >
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                                <span>{option.label}</span>
                                {showCounts && option.count !== undefined && (
                                    <Text size="xs" color="secondary">
                                        ({option.count})
                                    </Text>
                                )}
                            </Flex>
                        </Checkbox>
                    ))}

                    {options && options.length > maxVisible && (
                        <Box
                            style={{
                                cursor: 'pointer',
                                marginTop: vars.spacing['1']
                            }}
                            onClick={() => setShowAll(!showAll)}
                        >
                            <Text size="sm" color="primary">
                                {showAll ? (
                                    <Flex style={{ alignItems: 'center', gap: vars.spacing['1'] }}>
                                        <MinusIcon style={{ width: 16, height: 16 }} />
                                        Show less
                                    </Flex>
                                ) : (
                                    <Flex style={{ alignItems: 'center', gap: vars.spacing['1'] }}>
                                        <PlusIcon style={{ width: 16, height: 16 }} />
                                        Show {options.length - maxVisible} more
                                    </Flex>
                                )}
                            </Text>
                        </Box>
                    )}

                    {selectedValues.length > 0 && (
                        <Text size="xs" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                            {selectedValues.length} selected
                        </Text>
                    )}
                </FlexCol>
            )}
        </FilterSection>
    );
}

export default CheckboxFilterGroup;
