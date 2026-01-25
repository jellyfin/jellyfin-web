/**
 * Modern Fullscreen API utility
 * Replaces screenfull with native browser APIs
 */

export interface FullscreenEvent {
    readonly isFullscreen: boolean;
    readonly target: Element | null;
}

export type FullscreenChangeCallback = (event: FullscreenEvent) => void;

class FullscreenManager {
    private static instance: FullscreenManager | null = null;
    private readonly listeners: FullscreenChangeCallback[] = [];
    private isInitialized = false;

    private constructor() {
        this.initialize();
    }

    public static getInstance(): FullscreenManager {
        if (!FullscreenManager.instance) {
            FullscreenManager.instance = new FullscreenManager();
        }
        return FullscreenManager.instance;
    }

    private initialize(): void {
        if (this.isInitialized) return;

        this.isInitialized = true;
        this.addEventListeners();
    }

    private addEventListeners(): void {
        // Handle fullscreen change events
        const handleFullscreenChange = (): void => {
            const event: FullscreenEvent = {
                isFullscreen: this.isFullscreen,
                target: document.fullscreenElement
            };

            this.listeners.forEach(callback => {
                callback(event);
            });
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Add vendor prefixes for older browsers
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    public get isEnabled(): boolean {
        // Check for fullscreen API support
        return !!(
            (document as any).requestFullscreen ||
            (document as any).webkitRequestFullscreen ||
            (document as any).mozRequestFullScreen ||
            (document as any).msRequestFullscreen
        );
    }

    public get isFullscreen(): boolean {
        return !!document.fullscreenElement;
    }

    public get fullscreenElement(): Element | null {
        return document.fullscreenElement;
    }

    public async request(element?: Element): Promise<void> {
        const targetElement = element || document.documentElement;

        try {
            const requestFn =
                (targetElement as any).requestFullscreen ||
                (targetElement as any).webkitRequestFullscreen ||
                (targetElement as any).mozRequestFullScreen ||
                (targetElement as any).msRequestFullscreen;

            if (requestFn) {
                await requestFn.call(targetElement);
            } else {
                throw new Error('Fullscreen API is not supported');
            }
        } catch (error) {
            console.warn('Fullscreen request failed:', error);
            throw error;
        }
    }

    public async exit(): Promise<void> {
        try {
            const exitFn =
                document.exitFullscreen ||
                (document as any).webkitExitFullscreen ||
                (document as any).mozCancelFullScreen ||
                (document as any).msExitFullscreen;

            if (exitFn) {
                await exitFn.call(document);
            }
        } catch (error) {
            console.warn('Fullscreen exit failed:', error);
            throw error;
        }
    }

    public toggle(): Promise<void> {
        if (this.isFullscreen) {
            return this.exit();
        } else {
            return this.request();
        }
    }

    public on(event: 'change', callback: FullscreenChangeCallback): void {
        this.listeners.push(callback);
    }

    public off(event: 'change', callback: FullscreenChangeCallback): void {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    public async toggleElement(element: Element): Promise<void> {
        if (this.isFullscreen && this.fullscreenElement === element) {
            return this.exit();
        } else {
            return this.request(element);
        }
    }
}

// Export singleton instance for backward compatibility with screenfull API
const fullscreen = FullscreenManager.getInstance();

export default fullscreen;

// Export individual properties for direct access - matching screenfull API
export const {
    isEnabled,
    isFullscreen,
    fullscreenElement: element,
    request,
    exit,
    toggle,
    on,
    off,
    toggleElement
} = fullscreen;
