import ListItemButton, { ListItemButtonBaseProps } from '@mui/material/ListItemButton';
import React, { FC } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

interface ListItemLinkProps extends ListItemButtonBaseProps {
    to: string
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
    ...params
}) => {
    const location = useLocation();
    const [ searchParams ] = useSearchParams();

    const [ toPath, toParams ] = to.split('?');
    // eslint-disable-next-line compat/compat
    const toSearchParams = new URLSearchParams(`?${toParams}`);

    const selected = location.pathname === toPath && (!toParams || isMatchingParams(toSearchParams, searchParams));

    return (
        <ListItemButton
            component={Link}
            to={to}
            selected={selected}
            {...params}
        >
            {children}
        </ListItemButton>
    );
};

export default ListItemLink;
