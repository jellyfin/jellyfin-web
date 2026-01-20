import React, { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box/Box';
import Menu from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Typography from '@mui/joy/Typography/Typography';
import Divider from '@mui/material/Divider/Divider';
import Fade from '@mui/material/Fade/Fade';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export interface ActionMenuItem {
    id?: string;
    name?: string;
    textContent?: string;
    innerText?: string;
    icon?: string;
    asideText?: string;
    secondaryText?: string;
    selected?: boolean;
    divider?: boolean;
    value?: string;
}

export interface ActionMenuProps {
    items: ActionMenuItem[];
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    title?: string;
    text?: string;
    showCancel?: boolean;
    onCancel?: () => void;
    dialogClass?: string;
    positionY?: 'top' | 'bottom';
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
    items,
    anchorEl,
    open,
    onClose,
    onSelect,
    title,
    text,
    showCancel = false,
    onCancel,
    dialogClass,
    positionY
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);

    useEffect(() => {
        if (open) {
            setFocusedIndex(0);
        }
    }, [open]);

    const handleItemClick = useCallback((item: ActionMenuItem) => {
        const itemId = item.id == null || item.id === '' ? item.value : item.id;
        if (itemId) {
            onSelect(itemId);
        }
        onClose();
    }, [onSelect, onClose]);

    const handleCancel = useCallback(() => {
        if (onCancel) {
            onCancel();
        }
        onClose();
    }, [onCancel, onClose]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        const visibleItems = items.filter(item => !item.divider);

        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                setFocusedIndex(prev => (prev + 1) % visibleItems.length);
                break;
            }
            case 'ArrowUp': {
                event.preventDefault();
                setFocusedIndex(prev => (prev - 1 + visibleItems.length) % visibleItems.length);
                break;
            }
            case 'Enter': {
                event.preventDefault();
                const focusedItem = visibleItems[focusedIndex];
                if (focusedItem) {
                    handleItemClick(focusedItem);
                }
                break;
            }
            case 'Escape': {
                event.preventDefault();
                handleCancel();
                break;
            }
        }
    }, [items, focusedIndex, handleItemClick, handleCancel]);

    const getItemId = useCallback((item: ActionMenuItem): string => {
        return item.id == null || item.id === '' ? (item.value || '') : (item.id || '');
    }, []);

    const renderIcon = (icon: string | undefined, isSelected: boolean) => {
        if (!icon) {
            if (isSelected) {
                return <CheckIcon fontSize="small" />;
            }
            return null;
        }
        return <span className={`material-icons ${icon}`}>{icon}</span>;
    };

    const visibleItems = items.filter(item => !item.divider);

    const getMenuItemKey = (item: ActionMenuItem, index: number): string => {
        const itemId = item.id == null || item.id === '' ? item.value : item.id;
        return itemId || `item-${index}`;
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: positionY === 'top' ? 'top' : 'bottom',
                horizontal: 'left'
            }}
            transformOrigin={{
                vertical: positionY === 'top' ? 'bottom' : 'top',
                horizontal: 'left'
            }}
            MenuListProps={{
                onKeyDown: handleKeyDown,
                sx: {
                    minWidth: 240,
                    maxHeight: 400,
                    overflow: 'auto'
                }
            }}
            PaperProps={{
                className: dialogClass,
                sx: {
                    borderRadius: 2,
                    boxShadow: 3
                }
            }}
            TransitionComponent={Fade}
        >
            {title && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography level="title-sm" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                </Box>
            )}

            {text && (
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                        {text}
                    </Typography>
                </Box>
            )}

            <Box
                ref={menuRef}
                className="actionSheetScroller"
                sx={{
                    py: 1,
                    maxHeight: 320,
                    overflow: 'auto'
                }}
            >
                {items.map((item, index) => {
                    if (item.divider) {
                        // Dividers are structural elements without stable IDs
                        // Using index is acceptable here
                        return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
                    }

                    const itemKey = item.id || item.value || `item-${index}`;
                    const isFocused = visibleItems[focusedIndex] === item;

                    return (
                        <MenuItem
                            key={itemKey}
                            selected={item.selected || false}
                            onClick={() => handleItemClick(item)}
                            autoFocus={isFocused}
                            sx={{
                                py: 1.5,
                                mx: 1,
                                borderRadius: 1,
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'action.selected'
                                }
                            }}
                        >
                            {(item.icon || item.selected) && (
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {renderIcon(item.icon, !!item.selected)}
                                </ListItemIcon>
                            )}
                            <ListItemText
                                primary={item.name || item.textContent || item.innerText}
                                secondary={item.secondaryText}
                                secondaryTypographyProps={{
                                    sx: { color: 'text.secondary' }
                                }}
                            />
                            {item.asideText && (
                                <Typography level="body-xs" sx={{ color: 'text.secondary', ml: 2 }}>
                                    {item.asideText}
                                </Typography>
                            )}
                        </MenuItem>
                    );
                })}
            </Box>

            {showCancel && (
                <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
                    <MenuItem
                        onClick={handleCancel}
                        autoFocus
                        sx={{
                            py: 1.5,
                            borderRadius: 1,
                            '&:hover': {
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <CloseIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Cancel" />
                    </MenuItem>
                </Box>
            )}
        </Menu>
    );
};

export default ActionMenu;
