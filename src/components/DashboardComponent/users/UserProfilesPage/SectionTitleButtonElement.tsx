import React, { FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

const createButtonElement = ({ className, title, icon }) => ({
    __html: `<button
        is="emby-button"
        type="button"
        class="${className}"
        style="margin-left:1em;"
        title="${title}">
        <span class="material-icons ${icon}"></span>
    </button>`
});

type IProps = {
    title?: string;
    className?: string;
    icon?: string,
}

const SectionTitleButtonElement: FunctionComponent<IProps> = ({ className, title, icon }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createButtonElement({
                className: className,
                title: globalize.translate(title),
                icon: icon
            })}
        />
    );
};

export default SectionTitleButtonElement;
