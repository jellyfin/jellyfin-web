import { useUiStore } from '../store/uiStore';

/**
 * useLayout hook
 *
 * Reactive hook for layout information.
 */
export function useLayout() {
    const layout = useUiStore((state) => state.layout);
    const effectiveLayout = useUiStore((state) => state.effectiveLayout);
    const viewport = useUiStore((state) => state.viewport);
    const orientation = useUiStore((state) => state.orientation);

    const isMobile = effectiveLayout === 'mobile';
    const isTv = effectiveLayout === 'tv';
    const isDesktop = effectiveLayout === 'desktop';
    const isExperimental = layout === 'experimental';

    return {
        layout,
        effectiveLayout,
        viewport,
        orientation,
        isMobile,
        isTv,
        isDesktop,
        isExperimental
    };
}
