import React, { MouseEvent } from 'react';
import layoutManager from '../../components/layoutManager';
import shell from '../../scripts/shell';
import { appRouter } from '../../components/appRouter';
import { appHost } from '../../components/apphost';
import './emby-button.scss';

interface IProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    autohide?: boolean;
}

function onAnchorClick(e: MouseEvent<HTMLAnchorElement>) {
    const anchor = e.target as HTMLAnchorElement;
    const href = anchor.getAttribute('href') || '';

    if (href !== '#') {
        if (anchor.getAttribute('target')) {
            if (!appHost.supports('targetblank')) {
                e.preventDefault();
                shell.openUrl(href);
            }
        } else {
            e.preventDefault();
            appRouter.show(href);
        }
    } else {
        e.preventDefault();
    }
}

function LinkButton(props: IProps) {
    if (props.autohide === true && !appHost.supports('externallinks')) {
        return null;
    }

    let cssClass = `${props.className} emby-button`;

    // TODO replace all instances of element-showfocus with this method
    if (layoutManager.tv) {
        // handles all special css for tv layout
        // this method utilizes class chaining
        cssClass += ' show-focus';
    }

    /*const attributes = {};

    for (const prop in props) {
        if (prop.startsWith('data-')) {
            attributes[prop] = props[prop];
        }
    }*/

    return (
        <a
            className={cssClass}
            //{...attributes}
            href={props.href}
            target={props.target}
            title={props.title}
            aria-label={props['aria-label'] || props.title}
            onClick={onAnchorClick}
        >
            {props.children}
        </a>
    );
}

export default LinkButton;
