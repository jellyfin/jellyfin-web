import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./scrollManager', () => ({
    default: { isEnabled: () => false }
}));
vi.mock('../scripts/dom', async () => vi.importActual('../scripts/dom'));

let focusManager;

beforeEach(async () => {
    document.body.innerHTML = '';
    // jsdom returns null for offsetParent because it doesn't lay out the
    // page; override at the prototype level so focusManager's visibility
    // check passes for elements we explicitly attach to the body.
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            // Match the standard rule: offsetParent is null only for elements
            // that are display:none or detached.
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const el = this;
            if (!el.isConnected) return null;
            return el.parentNode === document
                || el.tagName === 'BODY'
                || el.tagName === 'HTML' ? null : document.body;
        }
    });
    focusManager = (await import('./focusManager')).default;
});

function mkBox(opts) {
    const el = document.createElement(opts.tag || 'button');
    el.classList.add('focusable');
    if (opts.cls) el.className += ' ' + opts.cls;
    if (opts.id) el.id = opts.id;
    const rect = opts.rect;
    el.getBoundingClientRect = () => ({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top
    });
    Object.defineProperty(el, 'offsetParent', { get: () => document.body });
    document.body.appendChild(el);
    return el;
}

describe('focusManager — JEL-2881 offscreen sidebar trap', () => {
    it('isCurrentlyFocusable rejects elements positioned entirely off the left of the viewport', () => {
        const offscreen = mkBox({ rect: { left: -320, top: 120, right: 0, bottom: 160 } });
        expect(focusManager.isCurrentlyFocusable(offscreen)).toBe(false);
    });

    it('isCurrentlyFocusable rejects elements positioned entirely above the viewport', () => {
        const aboveTop = mkBox({ rect: { left: 200, top: -80, right: 400, bottom: 0 } });
        expect(focusManager.isCurrentlyFocusable(aboveTop)).toBe(false);
    });

    it('isCurrentlyFocusable accepts elements within the viewport', () => {
        const onscreen = mkBox({ rect: { left: 100, top: 200, right: 400, bottom: 300 } });
        expect(focusManager.isCurrentlyFocusable(onscreen)).toBe(true);
    });

    it('isCurrentlyFocusable still accepts elements extending off the right edge (horizontal scroller targets)', () => {
        const offRight = mkBox({ rect: { left: 1800, top: 200, right: 2100, bottom: 300 } });
        expect(focusManager.isCurrentlyFocusable(offRight)).toBe(true);
    });

    it('getFocusableElements skips offscreen-left elements during initial autofocus search', () => {
        mkBox({ rect: { left: -320, top: 120, right: 0, bottom: 160 }, id: 'navItem' });
        mkBox({ rect: { left: 200, top: 400, right: 600, bottom: 500 }, id: 'card' });
        const elems = focusManager.getFocusableElements(document.body);
        const ids = elems.map(el => el.id);
        expect(ids).not.toContain('navItem');
        expect(ids).toContain('card');
    });

    it('moveRight from an offscreen-left source lands on in-viewport content, not another offscreen sibling', () => {
        const sidebar1 = mkBox({ rect: { left: -320, top: 100, right: 0, bottom: 140 }, id: 'sidebar1' });
        const sidebar2 = mkBox({ rect: { left: -320, top: 150, right: 0, bottom: 190 }, id: 'sidebar2' });
        const card = mkBox({ rect: { left: 200, top: 400, right: 500, bottom: 560 }, id: 'card' });
        sidebar1.focus = vi.fn();
        sidebar2.focus = vi.fn();
        card.focus = vi.fn();
        focusManager.moveRight(sidebar1);
        expect(card.focus).toHaveBeenCalled();
        expect(sidebar2.focus).not.toHaveBeenCalled();
    });

    it('moveDown from an offscreen-left source escapes to in-viewport content', () => {
        const sidebarTop = mkBox({ rect: { left: -320, top: 100, right: 0, bottom: 140 }, id: 'sidebarTop' });
        const sidebarBelow = mkBox({ rect: { left: -320, top: 200, right: 0, bottom: 240 }, id: 'sidebarBelow' });
        const card = mkBox({ rect: { left: 200, top: 400, right: 500, bottom: 560 }, id: 'card' });
        sidebarTop.focus = vi.fn();
        sidebarBelow.focus = vi.fn();
        card.focus = vi.fn();
        focusManager.moveDown(sidebarTop);
        expect(card.focus).toHaveBeenCalled();
        expect(sidebarBelow.focus).not.toHaveBeenCalled();
    });

    it('moveLeft from an in-viewport leftmost element does not jump back into the offscreen sidebar', () => {
        mkBox({ rect: { left: -320, top: 100, right: 0, bottom: 140 }, id: 'sidebar1' });
        const card = mkBox({ rect: { left: 80, top: 400, right: 320, bottom: 560 }, id: 'card' });
        card.focus = vi.fn();
        const sidebar = document.getElementById('sidebar1');
        sidebar.focus = vi.fn();
        focusManager.moveLeft(card);
        expect(sidebar.focus).not.toHaveBeenCalled();
    });
});
