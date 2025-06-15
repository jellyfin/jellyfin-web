import React, { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import MuiLink, { LinkProps as MuiLinkProps } from '@mui/material/Link';
import { isExternalLink, removeFirstHash } from './utils';

interface LinkProps extends Omit<MuiLinkProps, 'target' | 'rel'> {
    href: string;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
    ({ href, children, className, ...rest }, ref) => {
        const linkProps = isExternalLink(href) ?
            { target: '_blank', rel: 'noopener noreferrer', href: href } :
            { component: RouterLink, to: removeFirstHash(href) };

        return (
            <MuiLink ref={ref} {...linkProps} className={className} {...rest}>
                {children}
            </MuiLink>
        );
    }
);

Link.displayName = 'Link';

export default Link;
