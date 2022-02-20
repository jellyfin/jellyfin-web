import React, { Component, MutableRefObject, ReactNode } from 'react';
import itemShortcuts from '../../components/shortcuts';
import browser from '../../scripts/browser';

interface IProps {
    className?: string;
    enableContextMenu?: boolean;
    forwardedRef?: React.ForwardedRef<HTMLDivElement>;
    getCards?: () => ReactNode;
    onContextMenu?: (e: MouseEvent) => any;
}

// FIXME: Move to some utility file?
function disableEvent(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function getShortcutOptions() {
    return {
        click: false
    };
}

class CardsContainer extends Component<IProps> {
    ref: HTMLDivElement|null = null;

    constructor(props: IProps) {
        super(props);

        this.setRef = this.setRef.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onClick(e: React.MouseEvent<HTMLElement>) {
        // FIXME: need multiSelect
        const itemsContainer = this.ref as any;
        const multiSelect = itemsContainer.multiSelect;

        if (multiSelect && multiSelect.onContainerClick.call(itemsContainer, e) === false) {
            return;
        }

        itemShortcuts.onClick.call(itemsContainer, e);
    }

    setRef(ref: HTMLDivElement) {
        this.ref = ref;

        if (typeof this.props.forwardedRef === 'function') {
            this.props.forwardedRef(ref);
        } else {
            (this.props.forwardedRef as MutableRefObject<HTMLDivElement>).current = ref;
        }
    }

    componentDidMount() {
        const container = this.ref as HTMLDivElement;

        if (browser.touch) {
            container.addEventListener('contextmenu', disableEvent);
        } else {
            if (this.props.enableContextMenu !== false && this.props.onContextMenu) {
                container.addEventListener('contextmenu', this.props.onContextMenu);
            }
        }

        // TODO
        //if (layoutManager.desktop || layoutManager.mobile) {
        //    if (this.getAttribute('data-multiselect') !== 'false') {
        //        this.enableMultiSelect(true);
        //    }
        //}

        itemShortcuts.on(container, getShortcutOptions());

        // TODO
        //if (this.getAttribute('data-dragreorder') === 'true') {
        //    this.enableDragReordering(true);
        //}
    }

    componentWillUnmount() {
        const container = this.ref as HTMLDivElement;

        // TODO
        //this.enableMultiSelect(false);
        //this.enableDragReordering(false);

        if (this.props.onContextMenu) {
            container.removeEventListener('contextmenu', this.props.onContextMenu);
        }
        container.removeEventListener('contextmenu', disableEvent);

        itemShortcuts.off(container, getShortcutOptions());
    }

    render() {
        return (
            <div ref={this.setRef}
                className={this.props.className}
                onClick={this.onClick}
                aria-hidden='true'
            >
                {this.props.children}
                {this.props.getCards?.()}
            </div>
        );
    }
}

export default React.forwardRef<HTMLDivElement, React.PropsWithChildren<IProps>>((props, ref) => <CardsContainer
    forwardedRef={ref} {...props}
/>);
