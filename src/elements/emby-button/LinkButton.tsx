import React, { AnchorHTMLAttributes, DetailedHTMLProps, MouseEvent, useCallback } from 'react';
import classNames from 'classnames';
import layoutManager from '../../components/layoutManager';
import shell from '../../scripts/shell';
import { appRouter } from '../../components/router/appRouter';
import { appHost } from '../../components/apphost';
import './emby-button.scss';

interface LinkButtonProps extends DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
> {
    className?: string;
    isAutoHideEnabled?: boolean;
    href?: string;
    target?: string;
}

const LinkButton: React.FC<LinkButtonProps> = ({
    className,
    isAutoHideEnabled,
    href = '#', // The href must have a value to be focusable in the TV layout
    target,
    onClick,
    children,
    ...rest
}) => {
    const onAnchorClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
        const url = href || '';
        if (url !== '#') {
            if (target) {
                if (!appHost.supports('targetblank')) {
                    e.preventDefault();
                    shell.openUrl(url);
                }
            } else {
                e.preventDefault();
                appRouter.show(url)
                    .catch(err => {
                        console.error('[LinkButton] failed to show url', url, err);
                    });
            }
        } else {
            e.preventDefault();
        }
        onClick?.(e);
    }, [ href, target, onClick ]);

    if (isAutoHideEnabled === true && !appHost.supports('externallinks')) {
        return null;
    }

    const cssClass = classNames(
        'emby-button',
        className,
        { 'show-focus': layoutManager.tv }
    );

    return (
        <a
            className={cssClass}
            href={href}
            target={target}
            onClick={onAnchorClick}
            {...rest}
        >
            {children}
        </a>
    );
};

export default LinkButton;
