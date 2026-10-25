import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: { getApiClient: () => ({
        getLiveTvGuideInfo: () => new Promise(() => undefined),
        subscribe: () => () => undefined
    }) }
}));
vi.mock('../../scripts/inputManager', () => ({ default: {
    on: (element: Element, listener: EventListener) => element.addEventListener('command', listener),
    off: (element: Element, listener: EventListener) => element.removeEventListener('command', listener)
} }));
vi.mock('../../scripts/browser', () => ({ default: {} }));
vi.mock('../../lib/globalize', () => ({ default: { translateHtml: (html: string) => html } }));
vi.mock('../../utils/events.ts', () => ({ default: { trigger: vi.fn() } }));
vi.mock('../../scripts/scrollHelper', () => ({ default: { toStart: vi.fn(), toCenter: vi.fn() } }));
vi.mock('../loading/loading', () => ({ default: { show: vi.fn(), hide: vi.fn() } }));
vi.mock('../../scripts/datetime', () => ({ default: {} }));
vi.mock('../focusManager', () => ({ default: {
    moveUp: vi.fn(), moveDown: vi.fn(), moveLeft: vi.fn(), moveRight: vi.fn()
} }));
vi.mock('../playback/playbackmanager', () => ({ playbackManager: {} }));
vi.mock('../../scripts/settings/userSettings', () => ({}));
vi.mock('../images/imageLoader', () => ({ default: {} }));
vi.mock('../layoutManager', () => ({ default: { tv: true } }));
vi.mock('../shortcuts', () => ({ default: { on: vi.fn(), off: vi.fn() } }));
vi.mock('../../utils/dom', () => ({ default: {
    addEventListener: (element: Element, name: string, listener: EventListener, options: AddEventListenerOptions) => element.addEventListener(name, listener, options),
    parentWithClass: (element: Element, name: string) => element.closest('.' + name),
    parentWithTag: (element: Element, name: string) => element.closest(name)
} }));
vi.mock('../../elements/emby-programcell/emby-programcell', () => ({}));
vi.mock('../../elements/emby-button/emby-button', () => ({}));
vi.mock('../../elements/emby-button/paper-icon-button-light', () => ({}));
vi.mock('../../elements/emby-tabs/emby-tabs', () => ({}));
vi.mock('../../elements/emby-scroller/emby-scroller', () => ({}));
vi.mock('webcomponents.js/webcomponents-lite', () => ({}));
vi.mock('./tvguide.template.html', async () => {
    const { readFileSync } = await import('node:fs');
    return { default: readFileSync('src/components/guide/tvguide.template.html', 'utf8') };
});

import Guide from './guide';
import scrollHelper from '../../scripts/scrollHelper';

describe('TV guide focus scrolling', () => {
    let guide: { destroy: () => void } | undefined;
    afterEach(() => {
        guide?.destroy();
        document.body.textContent = '';
        vi.clearAllMocks();
    });

    function setup() {
        const element = document.createElement('div');
        document.body.appendChild(element);
        guide = new Guide({ element, serverId: 'fixture' });
        const scroller = element.querySelector('.guideVerticalScroller') as HTMLElement & { toCenter: ReturnType<typeof vi.fn> };
        scroller.toCenter = vi.fn();
        const row = document.createElement('div');
        row.className = 'channelPrograms';
        element.querySelector('.programGrid')?.appendChild(row);
        const cell = document.createElement('button');
        cell.className = 'programCell';
        row.appendChild(cell);
        return { element, scroller, cell };
    }

    it('scrolls a focused program even when no guide input command was received', () => {
        const { scroller, cell } = setup();
        cell.focus();
        expect(scroller.toCenter).toHaveBeenCalledWith(cell, true);
    });

    it('scrolls focused channel buttons without relying on a previous D-pad direction', () => {
        const { element, scroller } = setup();
        const channel = document.createElement('button');
        element.querySelector('.channelList')?.appendChild(channel);
        channel.focus();
        expect(scroller.toCenter).toHaveBeenCalledWith(channel, true);
    });

    it('keeps vertical focus visible after a horizontal command while retaining horizontal scrolling', () => {
        const { scroller, cell } = setup();
        cell.dispatchEvent(new CustomEvent('command', { bubbles: true, cancelable: true, detail: { command: 'right' } }));
        cell.focus();
        expect(scrollHelper.toCenter).toHaveBeenCalled();
        expect(scroller.toCenter).toHaveBeenCalledWith(cell, true);
    });

    function addProgram(element: HTMLElement) {
        const row = document.createElement('div');
        row.className = 'channelPrograms';
        element.querySelector('.programGrid')?.appendChild(row);
        const cell = document.createElement('button');
        cell.className = 'programCell';
        row.appendChild(cell);
        return cell;
    }

    function mockScrollLeft(element: HTMLElement) {
        let scrollLeft = 0;
        Object.defineProperty(element, 'scrollLeft', {
            configurable: true,
            get: () => scrollLeft,
            set: (value: number) => {
                scrollLeft = value;
            }
        });
    }

    it('does not reuse a previous horizontal command for later native focus changes', () => {
        const { element, cell } = setup();
        const nextCell = addProgram(element);
        cell.dispatchEvent(new CustomEvent('command', { bubbles: true, cancelable: true, detail: { command: 'right' } }));
        cell.focus();
        nextCell.focus();
        expect(scrollHelper.toCenter).toHaveBeenCalledTimes(1);
    });

    it('keeps the guide time position when native focus scrolls a long program into view', async () => {
        const { element, cell } = setup();
        const programGrid = element.querySelector('.programGrid') as HTMLElement;
        const longProgram = addProgram(element);
        mockScrollLeft(programGrid);
        programGrid.getBoundingClientRect = () => ({ left: 0, right: 1000 }) as DOMRect;
        longProgram.getBoundingClientRect = () => ({ left: -200, right: 3000 }) as DOMRect;
        programGrid.scrollLeft = 300;
        cell.focus();
        longProgram.addEventListener('focus', () => {
            programGrid.scrollLeft = 2000;
        });

        longProgram.focus();
        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(programGrid.scrollLeft).toBe(300);
        expect(scrollHelper.toStart).not.toHaveBeenCalled();
    });

    it('does not restore an old time position when focus did not come from the program grid', () => {
        const { element, cell } = setup();
        const programGrid = element.querySelector('.programGrid') as HTMLElement;
        mockScrollLeft(programGrid);
        programGrid.scrollLeft = 300;
        cell.focus();
        cell.blur();
        programGrid.scrollLeft = 2000;
        cell.focus();
        expect(programGrid.scrollLeft).toBe(2000);
    });

    it('requests native guide scrolling and does not scroll for header controls', () => {
        const { element, scroller } = setup();
        expect(scroller.getAttribute('data-allownativesmoothscroll')).toBe('true');
        expect(element.querySelector('.programGrid')?.getAttribute('data-scroll-mode-x')).toBe('custom');
        (element.querySelector('.btnGuideViewSettings') as HTMLElement).focus();
        expect(scroller.toCenter).not.toHaveBeenCalled();
    });
});
