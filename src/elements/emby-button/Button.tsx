import React from 'react';
import layoutManager from '../../components/layoutManager';
import './emby-button.scss';

export interface ButtonProps {
    action?: string;
}

type IProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonProps;

function Button(props: IProps) {
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
        <button
            className={cssClass}
            //{...attributes}
            title={props.title}
            aria-label={props['aria-label'] || props.title}
            onClick={props.onClick}
            data-action={props.action}
        >
            {props.children}
        </button>
    );
}

export default Button;
