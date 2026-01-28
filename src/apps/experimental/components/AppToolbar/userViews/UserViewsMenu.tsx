import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { type FC } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Box, Flex } from 'ui-primitives';
import { Menu, MenuItem } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

import LibraryIcon from 'apps/experimental/components/LibraryIcon';
import { appRouter } from 'components/router/appRouter';

interface UserViewsMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: React.ReactNode;
    userViews: BaseItemDto[];
    selectedId?: string;
    includeGlobalViews?: boolean;
}

const UserViewsMenu: FC<UserViewsMenuProps> = ({ userViews, selectedId, open, onOpenChange, trigger }) => {
    const navigate = useNavigate();

    const renderMenuItemContent = (icon: React.ReactNode, label: string, isSelected: boolean) => (
        <Flex align="center" gap={vars.spacing['4']}>
            <Box style={{ width: vars.spacing['6'], display: 'flex', justifyContent: 'center' }}>{icon}</Box>
            <Text size="md" weight={isSelected ? 'medium' : 'normal'}>
                {label}
            </Text>
        </Flex>
    );

    return (
        <Menu open={open} onOpenChange={onOpenChange} trigger={trigger}>
            {userViews.map(view => (
                <MenuItem
                    key={view.Id}
                    onClick={() => {
                        navigate({ to: appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1) });
                        onOpenChange(false);
                    }}
                >
                    {renderMenuItemContent(<LibraryIcon item={view} />, view.Name ?? '', view.Id === selectedId)}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default UserViewsMenu;
