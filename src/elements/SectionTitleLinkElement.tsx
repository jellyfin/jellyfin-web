import React, { type FC } from 'react';
import globalize from '../scripts/globalize';

const createLinkElement = ({ className, title, href }: { className?: string, title?: string, href?: string }) => ({
    __html: `<a
        is="emby-linkbutton"
        rel="noopener noreferrer"
        class="${className}"
        target="_blank"
        href="${href}"
        >
        ${title}
    </a>`
});

interface SectionTitleContainerProps {
    title?: string;
    className?: string;
    url?: string
}

const SectionTitleLinkElement: FC<SectionTitleContainerProps> = ({ className, title, url }) => {
    return (
        <div
            dangerouslySetInnerHTML={createLinkElement({
                className: className,
                title: globalize.translate(title),
                href: url
            })}
        />
    );
};

export default SectionTitleLinkElement;
