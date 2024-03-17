import React, { type FC } from 'react';
import globalize from '../../../scripts/globalize';

interface LinkEditUserPreferencesProps {
    title?: string;
    className?: string;
}

const createLinkElement = ({ className, title }: LinkEditUserPreferencesProps) => ({
    __html: `<a
        is="emby-linkbutton"
        class="${className}"
        href='#'
        >
        ${title}
    </a>`
});

const LinkEditUserPreferences: FC<LinkEditUserPreferencesProps> = ({ className, title }) => {
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
