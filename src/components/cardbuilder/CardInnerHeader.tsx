import React, { FunctionComponent, PropsWithChildren } from 'react';

type IProps = PropsWithChildren<{
    className?: string;
}>

const CardInnerHeader: FunctionComponent<IProps> = (props: IProps) => {
    return (
        <div className={`cardIndicators ${props.className || ''}`}>
            {props.children}
        </div>
    );
};

export default CardInnerHeader;
