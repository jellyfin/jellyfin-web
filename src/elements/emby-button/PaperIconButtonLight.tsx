import classNames from 'classnames';
import React from 'react';

interface IProps {
    action?: string;
    className?: string;
    icon: string;
    iconClassName?: string;
    title?: string;
    'aria-label'?: string;
}

function PaperIconButtonLight(props: IProps) {
    return (
        <button
            className={classNames('paper-icon-button-light', props.className)}
            data-action={props.action}
            title={props.title}
            aria-label={props['aria-label'] || props.title}
        >
            <span className={classNames('material-icons', props.iconClassName, props.icon)} aria-hidden='true'></span>
        </button>
    );
}

export default PaperIconButtonLight;
