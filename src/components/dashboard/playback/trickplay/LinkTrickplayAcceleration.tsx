import React, { type FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

type IProps = {
    title?: string;
    className?: string;
    href?: string;
};

const createLinkElement = ({ className, title, href }: IProps) => ({
    __html: `<a
        is="emby-linkbutton"
        rel="noopener noreferrer"
        class="${className}"
        href="${href}"
        >
        ${title}
    </a>`
});

const LinkTrickplayAcceleration: FunctionComponent<IProps> = ({ className, title, href }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createLinkElement({
                className,
                title: globalize.translate(title),
                href
            })}
        />
    );
};

export default LinkTrickplayAcceleration;
