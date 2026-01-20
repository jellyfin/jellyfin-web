import ListItemButton from '@mui/joy/ListItemButton';
import React, { FC } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

interface ListItemLinkProps {
    to: string;
    includePaths?: string[];
    excludePaths?: string[];
    children: React.ReactNode;
    sx?: any;
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
    sx,
    ...params
}) => {
    const location = useLocation();
    const [ searchParams ] = useSearchParams();

    const [ toPath, toParams ] = to.split('?');
    // eslint-disable-next-line compat/compat
    const toSearchParams = new URLSearchParams(`?${toParams}`);
    const selectedPaths = [ toPath, ...includePaths ];

    const selected = selectedPaths.includes(location.pathname)
        && !excludePaths.includes(location.pathname + location.search)
        && (!toParams || isMatchingParams(toSearchParams, searchParams));

    return (
        <ListItemButton
            component={Link}
            to={to}
            selected={selected}
            sx={{
                borderRadius: 'sm',
                ...(selected && {
                    bgcolor: 'primary.softBg',
                    color: 'primary.plainColor',
                    '&:hover': {
                        bgcolor: 'primary.softHoverBg',
                    },
                }),
                ...sx
            }}
            {...params}
        >
            {children}
        </ListItemButton>
    );
};

export { ListItemLink };
export default ListItemLink;