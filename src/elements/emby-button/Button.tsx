import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import classNames from 'classnames';
import layoutManager from '../../components/layoutManager';
import './emby-button.scss';
import globalize from '../../scripts/globalize';

interface ButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  icon?: string;
  iconClassName?: string;
  iconPos?: string;
}

const Button: React.FC<ButtonProps> = ({
    className,
    title,
    icon,
    iconClassName,
    iconPos,
    onClick,
    ...rest
}) => {
    let cssClass = classNames('emby-button', className);

    if (layoutManager.tv) {
        cssClass += ' show-focus';
    }

    return (
        <button
            className={cssClass}
            onClick={onClick}
            {...rest}
        >
            {icon && iconPos === 'LEFT' && <span className={classNames('material-icons', iconClassName, icon)} aria-hidden='true'></span>}

            <span>{globalize.translate(title)}</span>

            {icon && iconPos === 'RIGHT' && <span className={classNames('material-icons', iconClassName, icon)} aria-hidden='true'></span>}
        </button>
    );
};

export default Button;
