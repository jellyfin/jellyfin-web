import React, { useState, useCallback, useEffect } from 'react';
import Box from '@mui/joy/Box';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import Divider from '@mui/joy/Divider';
import List from '@mui/joy/List';

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
    dialogClass
}) => {
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

    const renderIcon = (icon: string | undefined, isSelected: boolean) => {
        if (!icon) {
            if (isSelected) {
                return <CheckIcon />;
            }
            return null;
        }
        return <span className={`material-icons ${icon}`}>{icon}</span>;
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            className={dialogClass}
            placement="bottom-start"
            sx={{
                minWidth: 240,
                maxHeight: 400,
                overflow: 'auto',
                borderRadius: 'md',
                boxShadow: 'md',
                zIndex: 1300
            }}
        >
            {title && (
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography level="title-sm" fontWeight="bold">
                        {title}
                    </Typography>
                </Box>
            )}

            {text && (
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography level="body-sm" color="neutral">
                        {text}
                    </Typography>
                </Box>
            )}

            {(title || text) && <Divider />}

            <List sx={{ '--ListItem-radius': '8px', p: 1 }}>
                {items.map((item, index) => {
                    if (item.divider) {
                        return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
                    }

                    const itemKey = item.id || item.value || `item-${index}`;

                    return (
                        <MenuItem
                            key={itemKey}
                            selected={item.selected}
                            onClick={() => handleItemClick(item)}
                        >
                            {(item.icon || item.selected) && (
                                <ListItemDecorator>
                                    {renderIcon(item.icon, !!item.selected)}
                                </ListItemDecorator>
                            )}
                            <ListItemContent>
                                <Typography level="body-md">
                                    {item.name || item.textContent || item.innerText}
                                </Typography>
                                {item.secondaryText && (
                                    <Typography level="body-xs" color="neutral">
                                        {item.secondaryText}
                                    </Typography>
                                )}
                            </ListItemContent>
                            {item.asideText && (
                                <Typography level="body-xs" color="neutral" sx={{ ml: 2 }}>
                                    {item.asideText}
                                </Typography>
                            )}
                        </MenuItem>
                    );
                })}
            </List>

            {showCancel && (
                <>
                    <Divider />
                    <MenuItem
                        onClick={handleCancel}
                        sx={{ color: 'danger.plainColor' }}
                    >
                        <ListItemDecorator>
                            <CloseIcon />
                        </ListItemDecorator>
                        Cancel
                    </MenuItem>
                </>
            )}
        </Menu>
    );
};

export default ActionMenu;