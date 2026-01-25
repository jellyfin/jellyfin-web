/**
 * @deprecated This module is deprecated in favor of React components.
 */
declare module '../../../../scripts/libraryMenu' {
    interface LibraryMenuInterface {
        getTopParentId: () => string | null;
        onHardwareMenuButtonClick: () => void;
        setTabs: (type: string | null, selectedIndex: number, builder: () => unknown[]) => void;
        setDefaultTitle: () => void;
        setTitle: (title: string) => void;
        setTransparentMenu: (transparent: boolean) => void;
    }

    const LibraryMenu: LibraryMenuInterface;
    export default LibraryMenu;
}
