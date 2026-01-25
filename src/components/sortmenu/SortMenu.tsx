import React, { useState, useEffect } from 'react';
import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';

import { Box, Flex } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives/Select';
import { Dialog, DialogPortal, DialogOverlayComponent, DialogContentComponent } from 'ui-primitives/Dialog';
import { FormControl, FormLabel } from 'ui-primitives/FormControl';

interface SortOption {
    value: string;
    name: string;
}

interface SortMenuOptions {
    sortOptions: SortOption[];
    sortBy: string;
    sortOrder: 'Ascending' | 'Descending';
    settingsKey: string;
}

interface SortMenuProps {
    open: boolean;
    onClose: () => void;
    onChange: (options: SortMenuOptions) => void;
    options: SortMenuOptions;
}

export function SortMenu({ open, onClose, onChange, options }: SortMenuProps) {
    const [sortBy, setSortBy] = useState(options.sortBy);
    const [sortOrder, setSortOrder] = useState(options.sortOrder);

    useEffect(() => {
        setSortBy(options.sortBy);
        setSortOrder(options.sortOrder);
    }, [options]);

    const handleSave = () => {
        userSettings.setFilter(options.settingsKey + '-sortorder', sortOrder);
        userSettings.setFilter(options.settingsKey + '-sortby', sortBy);
        onChange({ ...options, sortBy, sortOrder });
        onClose();
    };

    const handleClose = () => {
        setSortBy(options.sortBy);
        setSortOrder(options.sortOrder);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={isOpen => !isOpen && handleClose()}>
            <DialogPortal>
                <DialogOverlayComponent />
                <DialogContentComponent title={globalize.translate('Sort')} style={{ maxWidth: '400px' }}>
                    <Box style={{ padding: '24px' }}>
                        <Box style={{ marginBottom: '24px' }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelSortBy')}</FormLabel>
                                <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue />
                                        <SelectContent>
                                            {options.sortOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectTrigger>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box style={{ marginBottom: '24px' }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelSortOrder')}</FormLabel>
                                <Select
                                    value={sortOrder}
                                    onValueChange={(value: 'Ascending' | 'Descending') => setSortOrder(value)}
                                >
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue />
                                        <SelectContent>
                                            <SelectItem value="Ascending">
                                                <Flex style={{ alignItems: 'center', gap: '8px' }}>
                                                    <ChevronUpIcon />
                                                    {globalize.translate('Ascending')}
                                                </Flex>
                                            </SelectItem>
                                            <SelectItem value="Descending">
                                                <Flex style={{ alignItems: 'center', gap: '8px' }}>
                                                    <ChevronDownIcon />
                                                    {globalize.translate('Descending')}
                                                </Flex>
                                            </SelectItem>
                                        </SelectContent>
                                    </SelectTrigger>
                                </Select>
                            </FormControl>
                        </Box>

                        <Flex style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <Button variant="ghost" onClick={handleClose}>
                                {globalize.translate('ButtonBack')}
                            </Button>
                            <Button variant="primary" onClick={handleSave}>
                                {globalize.translate('Save')}
                            </Button>
                        </Flex>
                    </Box>
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
}

export function useSortMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<SortMenuOptions>({
        sortOptions: [],
        sortBy: '',
        sortOrder: 'Ascending',
        settingsKey: ''
    });

    const show = (opts: Omit<SortMenuOptions, 'sortBy' | 'sortOrder'>) => {
        setOptions({
            ...opts,
            sortBy: userSettings.getFilter(opts.settingsKey + '-sortby') || '',
            sortOrder:
                (userSettings.getFilter(opts.settingsKey + '-sortorder') as 'Ascending' | 'Descending') || 'Ascending'
        });
        setIsOpen(true);
    };

    const hide = () => setIsOpen(false);

    return {
        isOpen,
        options,
        show,
        hide
    };
}

export default SortMenu;
