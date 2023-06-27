import React, { type RefAttributes } from 'react';
import { Link } from 'react-router-dom';
import { GridActionsCellItem, type GridActionsCellItemProps } from '@mui/x-data-grid';

type GridActionsCellLinkProps = { to: string } & GridActionsCellItemProps & RefAttributes<HTMLButtonElement>;

/**
 * Link component to use in mui's data-grid action column due to a current bug with passing props to custom link components.
 * @see https://github.com/mui/mui-x/issues/4654
 */
const GridActionsCellLink = ({ to, ...props }: GridActionsCellLinkProps) => (
    <Link to={to}>
        <GridActionsCellItem {...props} />
    </Link>
);

export default GridActionsCellLink;
