import classNames from 'classnames';
import React, { FunctionComponent, PropsWithChildren } from 'react';

type IProps = PropsWithChildren<{
    className?: string;
}>

const CardOuterFooter: FunctionComponent<IProps> = (props: IProps) => {
    return (
        <div className={classNames('cardFooter', props.className)}>
            {props.children}
        </div>
    );
};

export default CardOuterFooter;
