import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import classNames from 'classnames';
import layoutManager from '../../components/layoutManager';
import './emby-button.scss';
import { deprecate } from '../../utils/deprecation';

enum IconPosition {
    RIGHT = 'RIGHT',
    LEFT = 'LEFT'
}

interface ButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    icon?: string;
    iconClassName?: string;
    iconPos?: string;
}

const Button: React.FC<ButtonProps> = ({ className, title, icon, iconClassName, iconPos, onClick, ...rest }) => {
    deprecate('emby-button/Button', 'ui-primitives/Button', 'src/elements/emby-button/Button.tsx');

    const btnClass = classNames('emby-button', className, { 'show-focus': layoutManager.tv });

    const iconClass = classNames('material-icons', iconClassName, icon);

    return (
        <button className={btnClass} onClick={onClick} {...rest}>
            {icon && iconPos === IconPosition.LEFT && <span className={iconClass} aria-hidden="true" />}
            <span>{title}</span>
            {icon && iconPos === IconPosition.RIGHT && <span className={iconClass} aria-hidden="true" />}
        </button>
    );
};

export default Button;
