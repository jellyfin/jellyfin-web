import React, { type FC, type MouseEvent, Fragment, useState, useCallback } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { LinkItem } from '../types/LinkItemList';

interface CompactMenuProps {
    links: LinkItem[];
    limit?: number;
}

const CompactMenu: FC<CompactMenuProps> = ({ links, limit = 3 }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = useCallback((event: MouseEvent<HTMLButtonElement> | null) => {
        if (event) {
            setAnchorEl(event.currentTarget);
        }
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const displayedLinks = links.slice(0, limit);

    return (
        <Fragment>
            <Breadcrumbs>
                {displayedLinks?.map((val) => (
                    <Link
                        key={val.title}
                        underline='hover'
                        color='inherit'
                        href={val.href}
                        rel={val.rel}
                        target={val.target}
                    >
                        {val.title}
                    </Link>
                ))}
                {links.length > limit && (
                    <IconButton color='primary' size='small' onClick={handleClick}>
                        <MoreHorizIcon />
                    </IconButton>
                )}
            </Breadcrumbs>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {links.slice(limit).map((link) => (
                    <MenuItem
                        key={link.title}
                        component={Link}
                        href={link.href}
                        rel={link.rel}
                        target={link.target}
                        onClick={handleClose}
                    >
                        {link.title}
                    </MenuItem>
                ))}
            </Menu>
        </Fragment>
    );
};

export default CompactMenu;
