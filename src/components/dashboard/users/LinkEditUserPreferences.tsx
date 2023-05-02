import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

type IProps = {
    title?: string;
    className?: string;
};

const createLinkElement = ({ className, title }: IProps) => ({
    __html: `<a
        is="emby-linkbutton"
        class="${className}"
        href='#'
        >
        ${title}
    </a>`
});

const LinkEditUserPreferences: FunctionComponent<IProps> = ({ className, title }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createLinkElement({
                className: className,
                title: globalize.translate(title)
            })}
        />
    );
};

export default LinkEditUserPreferences;
