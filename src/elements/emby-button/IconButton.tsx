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
    let cssClass = classNames('paper-icon-button-light', className);

    if (layoutManager.tv) {
        cssClass += ' show-focus';
    }

    return (
        <button
            className={cssClass}
            title={title}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            <span className={classNames('material-icons', iconClassName, icon)} aria-hidden='true'></span>
        </button>
    );
};

export default IconButton;
