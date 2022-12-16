import React, { AnchorHTMLAttributes, DetailedHTMLProps, MouseEvent } from 'react';
import classNames from 'classnames';
import layoutManager from '../../components/layoutManager';
import shell from '../../scripts/shell';
import { appRouter } from '../../components/appRouter';
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
    href,
    target,
    children,
    ...rest
}) => {
    const onAnchorClick = (e: MouseEvent<HTMLAnchorElement>) => {
        const url = href || '';
        if (url !== '#') {
            if (target) {
                if (!appHost.supports('targetblank')) {
                    e.preventDefault();
                    shell.openUrl(url);
                }
            } else {
                e.preventDefault();
                appRouter.show(url);
            }
        } else {
            e.preventDefault();
        }
    };

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
