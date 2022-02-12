import React, { FunctionComponent, PropsWithChildren } from 'react';
import 'material-design-icons-iconfont';
import '../indicators/indicators.scss';

type IProps = PropsWithChildren<{
    className?: string;
    icon?: string;
}>

const CardIndicator: FunctionComponent<IProps> = ({ children, className, icon }: IProps) => {
    return (
        <div className={`${className || ''} indicator`}>
            {icon ? <span className={`material-icons indicatorIcon ${icon}`}></span> : null}
            {children}
        </div>
    );
};

export default CardIndicator;
