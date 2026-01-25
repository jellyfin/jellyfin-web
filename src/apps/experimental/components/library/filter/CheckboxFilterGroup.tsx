import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FilterSection } from './FilterSection';
import { Checkbox } from 'ui-primitives/Checkbox';
import { Box, Flex, FlexCol } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';
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
                <FlexCol style={{ gap: '8px' }}>
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
                <FlexCol style={{ gap: '8px' }}>
                    {visibleOptions?.map(option => (
                        <Checkbox
                            key={option.value}
                            checked={selectedValues.includes(option.value)}
                            onChangeChecked={() => handleToggle(option.value)}
                        >
                            <Flex style={{ alignItems: 'center', gap: '8px' }}>
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
                                marginTop: '4px'
                            }}
                            onClick={() => setShowAll(!showAll)}
                        >
                            <Text size="sm" color="primary">
                                {showAll ? (
                                    <Flex style={{ alignItems: 'center', gap: '4px' }}>
                                        <MinusIcon style={{ width: 16, height: 16 }} />
                                        Show less
                                    </Flex>
                                ) : (
                                    <Flex style={{ alignItems: 'center', gap: '4px' }}>
                                        <PlusIcon style={{ width: 16, height: 16 }} />
                                        Show {options.length - maxVisible} more
                                    </Flex>
                                )}
                            </Text>
                        </Box>
                    )}

                    {selectedValues.length > 0 && (
                        <Text size="xs" color="secondary" style={{ marginTop: '4px' }}>
                            {selectedValues.length} selected
                        </Text>
                    )}
                </FlexCol>
            )}
        </FilterSection>
    );
}

export default CheckboxFilterGroup;
