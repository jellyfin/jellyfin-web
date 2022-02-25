import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

type IProps = {
    title: string;
    className?: string;
    icon: string,
}

const createButtonElement = ({ className, title, icon }: { className?: string, title: string, icon: string }) => ({
    __html: `<button
        is="emby-button"
        type="button"
        class="${className}"
        style="margin-left:1em;"
        title="${title}"
    >
        <span class="material-icons ${icon}" aria-hidden="true"></span>
    </button>`
});

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
