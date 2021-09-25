import React, { FunctionComponent } from 'react';
import globalize from '../../../../../scripts/globalize';

type IProps = {
    title: string;
    className?: string;
    url: string
}

const createLinkElement = ({ className, title, href }) => ({
    __html: `<a
    is="emby-linkbutton"
    rel="noopener noreferrer"
    class="${className}"
    target="_blank"
    href="${href}"
    >
    ${globalize.translate(title)}
    </a>`
});

const SectionTitleLinkElement: FunctionComponent<IProps> = ({ className, title, url }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createLinkElement({
                className: className,
                title: title,
                href: url
            })}
        />
    );
};

export default SectionTitleLinkElement;
