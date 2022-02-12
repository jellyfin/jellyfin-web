import React, { FunctionComponent, PropsWithChildren } from 'react';

type IProps = PropsWithChildren<{
    className?: string;
}>

const CardInnerFooter: FunctionComponent<IProps> = (props: IProps) => {
    return (
        // FIXME: classes may differ
        <div className={`${props.className || ''} innerCardFooter fullInnerCardFooter innerCardFooterClear`}>
            {props.children}
        </div>
    );
};

export default CardInnerFooter;
