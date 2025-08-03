import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Favorite from '@mui/icons-material/Favorite';
import Star from '@mui/icons-material/Star';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React, { type MouseEvent, useCallback, useState } from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

const MyCustomSection = () => {
    const [ isExpanded, setIsExpanded ] = useState(false);

    const onSectionClick = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(isOpen => !isOpen);
        
        // Log when the section is clicked
        console.log('My Custom Section clicked!', { isExpanded: !isExpanded });
    }, [isExpanded]);

    return (
        <List
            aria-labelledby='custom-subheader'
            subheader={
                <ListSubheader component='div' id='custom-subheader'>
                    My Custom Section
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemButton onClick={onSectionClick}>
                    <ListItemIcon>
                        <Favorite />
                    </ListItemIcon>
                    <ListItemText primary="Custom Features" />
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
            </ListItem>
            
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    <ListItem disablePadding sx={{ pl: 4 }}>
                        <ListItemLink to='/dashboard'>
                            <ListItemIcon>
                                <Star />
                            </ListItemIcon>
                            <ListItemText primary="My Feature" />
                        </ListItemLink>
                    </ListItem>
                </List>
            </Collapse>
        </List>
    );
};

export default MyCustomSection;
