import React, {
    type FC,
    type MouseEvent,
    Fragment,
    useState,
    useCallback
} from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Link from 'components/common/link/Link';
import type { LinkItem } from '../types';

interface CompactMenuProps {
    linkItems: LinkItem[];
    limit?: number;
}

const CompactMenu: FC<CompactMenuProps> = ({
    linkItems,
    limit = 3
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = useCallback(
        (e: MouseEvent<HTMLButtonElement> | null) => {
            if (e) {
                setAnchorEl(e.currentTarget);
            }
        },
        []
    );

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const displayedLinkItems = linkItems.slice(0, limit);

    return (
        <Fragment>
            <Breadcrumbs>
                {displayedLinkItems?.map((linkItem) => (
                    <Link
                        key={linkItem.text}
                        underline='hover'
                        color='inherit'
                        href={linkItem.url}
                    >
                        {linkItem.text}
                    </Link>
                ))}
                {linkItems.length > limit && (
                    <IconButton
                        color='primary'
                        size='small'
                        onClick={handleClick}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                )}
            </Breadcrumbs>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                {linkItems.slice(limit).map((linkItem) => (
                    <MenuItem
                        key={linkItem.text}
                        component={Link}
                        href={linkItem.url}
                        onClick={handleClose}
                    >
                        {linkItem.text}
                    </MenuItem>
                ))}
            </Menu>
        </Fragment>
    );
};

export default CompactMenu;
