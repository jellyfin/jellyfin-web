import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import classNames from 'classnames';
import layoutManager from '../../components/layoutManager';
import './emby-button.scss';

interface IconButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
> {
    icon?: string;
    iconClassName?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
    className,
    title,
    icon,
    iconClassName,
    disabled = false,
    onClick,
    ...rest
}) => {
    const btnClass = classNames(
        'paper-icon-button-light',
        className,
        { 'show-focus': layoutManager.tv }
    );

    const iconClass = classNames(
        'material-icons',
        iconClassName,
        icon
    );

    return (
        <button
            className={btnClass}
            title={title}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            <span className={iconClass} aria-hidden='true' />
        </button>
    );
};

export default IconButton;
