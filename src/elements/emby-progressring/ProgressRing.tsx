import React, { FunctionComponent } from 'react';
import './emby-progressring';

type IProps = {
    progress?: number;
    className?: string;
    status?: string
}

const ProgressRing: FunctionComponent<IProps> = ({ className, progress, status }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={{
                __html: `<div
                    is="emby-progressring"
                    class="${className}"
                    data-progress="${progress || 0}"
                    data-status="${status}"
                    >
                </div>`
            }}
        />
    );
};

export default ProgressRing;
