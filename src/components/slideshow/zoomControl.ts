import type Swiper from 'swiper';
import { getIcon } from './slideshowhelper';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

const buttonZoomStep = 0.5;
const minZoom = 0.1;
const maxZoom = 3;

export default class ZoomControl {
    swiper: Swiper;
    dialog: HTMLDivElement;
    slides: BaseItemDto[];

    static getHtml() {
        return `\
<div class="zoomControl">\
${getIcon('zoom_out', 'btnZoomOut', true)}\
<div class="sliderContainer"><input is="emby-slider" type="range" step="0.001" min="${minZoom}" max="${maxZoom}" value="1" class="zoomSlider"/></div>\
${getIcon('zoom_in', 'btnZoomIn', true)}\
</div>\
`;
    }

    constructor(dialog: HTMLDivElement, swiper: Swiper, slides: BaseItemDto[]) {
        this.dialog = dialog;
        this.swiper = swiper;
        this.slides = slides;
    }

    bindEvents() {
        const zoomSlider = this.dialog.querySelector<HTMLInputElement>('.zoomSlider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                const initialRealScale = this.getInitialRealScale();
                if (e.target && initialRealScale) {
                    const realScale = Number((e.target as HTMLInputElement).value);
                    this.swiper.zoom.in(realScale / initialRealScale);
                }
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (zoomSlider as any).getBubbleText = (_: number, value: number) => `${Math.trunc(value * 100)}%`;
        }
        this.dialog.querySelector<HTMLButtonElement>('.btnZoomOut')?.addEventListener('click', () => {
            const initialRealScale = this.getInitialRealScale();
            if (initialRealScale) {
                this.swiper.zoom.in(Math.max(this.swiper.zoom.scale - buttonZoomStep, Math.min(initialRealScale, minZoom) / initialRealScale));
            }
        });
        this.dialog.querySelector<HTMLButtonElement>('.btnZoomIn')?.addEventListener('click', () => {
            const initialRealScale = this.getInitialRealScale();
            if (initialRealScale) {
                this.swiper.zoom.in(Math.min(this.swiper.zoom.scale + buttonZoomStep, Math.max(initialRealScale, maxZoom) / initialRealScale));
            }
        });

        this.swiper.on('zoomChange', (_: Swiper, scale: number) => {
            this.updateZoomControl(scale);
        });

        this.swiper.on('slidesUpdated', () => {
            this.updateZoomControl();
        });
    }

    private getCurrentImageElement() {
        const currentItemId = this.slides[this.swiper.activeIndex].Id;
        const activeSlide = this.dialog.querySelector(`[data-itemid="${currentItemId}"]`);
        return activeSlide?.querySelector<HTMLImageElement>('img');
    }

    private getInitialRealScale() {
        const imageElement = this.getCurrentImageElement();
        if (imageElement) {
            return imageElement.width / imageElement.naturalWidth;
        }
    }

    private updateZoomControl(scale?: number) {
        const updateZoomControlAfterImageLoaded = () => {
            const initialRealScale = this.getInitialRealScale();
            if (initialRealScale) {
                const currentRealScale = (scale ?? this.swiper.zoom.scale) * initialRealScale;
                const zoomOutButton = this.dialog.querySelector<HTMLButtonElement>('.btnZoomOut');
                if (zoomOutButton) {
                    zoomOutButton.disabled = currentRealScale <= Math.min(initialRealScale, minZoom);
                }
                const zoomInButton = this.dialog.querySelector<HTMLButtonElement>('.btnZoomIn');
                if (zoomInButton) {
                    zoomInButton.disabled = currentRealScale >= Math.max(initialRealScale, maxZoom);
                }
                const zoomSlider = this.dialog.querySelector<HTMLInputElement>('.zoomSlider');
                if (zoomSlider) {
                    zoomSlider.max = Math.max(initialRealScale, maxZoom).toFixed(3);
                    zoomSlider.min = Math.min(initialRealScale, minZoom).toFixed(3);
                    zoomSlider.value = currentRealScale.toString();
                }
            }
        };

        const imageElement = this.getCurrentImageElement();
        if (imageElement) {
            if (!imageElement.complete) {
                imageElement.onload = updateZoomControlAfterImageLoaded;
            } else {
                updateZoomControlAfterImageLoaded();
            }
        }
    }
}
