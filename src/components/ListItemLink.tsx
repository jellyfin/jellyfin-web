import React, { FC } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ListItemButton } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { useSearchParams } from 'hooks/useSearchParams';

interface ListItemLinkProps {
    to: string;
    includePaths?: string[];
    excludePaths?: string[];
    children: React.ReactNode;
    style?: React.CSSProperties;
    selected?: boolean;
}

const isMatchingParams = (routeParams: URLSearchParams, currentParams: URLSearchParams) => {
    for (const param of routeParams) {
        if (currentParams.get(param[0]) !== param[1]) {
            return false;
        }
    }

    return true;
};

const ListItemLink: FC<ListItemLinkProps> = ({
    children,
    to,
    includePaths = [],
    excludePaths = [],
    style,
    selected: selectedOverride,
    ...params
}) => {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [toPath, toParams] = to.split('?');
    const toSearchParams = new URLSearchParams(`?${toParams}`);
    const selectedPaths = [toPath, ...includePaths];

    const isSelected =
        selectedOverride ??
        (selectedPaths.includes(location.pathname) &&
            !excludePaths.includes(location.pathname + location.search) &&
            (!toParams || isMatchingParams(toSearchParams, searchParams)));

    return (
        <ListItemButton
            component={Link}
            to={to}
            active={isSelected}
            style={{
                borderRadius: vars.borderRadius.sm,
                ...(isSelected && {
                    backgroundColor: vars.colors.primaryLight,
                    color: vars.colors.primary
                }),
                ...style
            }}
            {...params}
        >
            {children}
        </ListItemButton>
    );
};

export { ListItemLink };
export default ListItemLink;
