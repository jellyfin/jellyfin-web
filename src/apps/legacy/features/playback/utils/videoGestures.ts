type InputKind = 'mouse' | 'touch';
type Direction = -1 | 1;

interface Contact {
    kind: InputKind;
    x: number;
    y: number;
    startedAt: number;
}

interface CompletedContact extends Contact {
    direction: Direction;
    completedAt: number;
}

interface Options {
    enabled: () => boolean;
    single: (kind: InputKind) => void;
    double: (direction: Direction) => void;
}

const PAIR_WINDOW_MS = 500;
const MAX_DISTANCE = 25;
const COMPATIBILITY_MOUSE_MS = 1_000;

/** Recognize completed contacts rather than relying on synthesized mouse dblclick. */
export function createVideoGestures(surface: HTMLElement, options: Options) {
    const document = surface.ownerDocument;
    const window = document.defaultView!;
    const contacts = new Map<number, Contact | null>();
    const removers: (() => void)[] = [];
    let pending: CompletedContact | undefined;
    let singleTimer: ReturnType<typeof setTimeout> | undefined;
    let ignoreMouseUntil = 0;

    function clearPending() {
        clearTimeout(singleTimer);
        singleTimer = undefined;
        pending = undefined;
    }

    function reset() {
        clearPending();
        contacts.clear();
    }

    function resolveSingle() {
        const contact = pending;
        clearPending();
        if (contact && options.enabled()) options.single(contact.kind);
    }

    function begin(id: number, kind: InputKind, x: number, y: number, target: EventTarget | null, primary: boolean) {
        if (kind === 'mouse' && Date.now() < ignoreMouseUntil) return;
        if (!options.enabled()) {
            reset();
            return;
        }
        // A control interaction cannot complete a video pair or leave a pause queued.
        if (target !== surface || !primary) clearPending();
        contacts.set(id, target === surface && primary ? { kind, x, y, startedAt: Date.now() } : null);
        if (contacts.size > 1) {
            clearPending();
            contacts.forEach((_contact, key) => {
                contacts.set(key, null);
            });
        }
    }

    function move(id: number, x: number, y: number) {
        const contact = contacts.get(id);
        if (contact && Math.hypot(x - contact.x, y - contact.y) > MAX_DISTANCE) {
            contacts.set(id, null);
            clearPending();
        }
    }

    function end(id: number, x: number, y: number, target: EventTarget | null) {
        move(id, x, y);
        const contact = contacts.get(id);
        contacts.delete(id);
        const now = Date.now();
        if (!contact || target !== surface || !options.enabled() || now - contact.startedAt > PAIR_WINDOW_MS) {
            clearPending();
            return;
        }
        const bounds = surface.getBoundingClientRect();
        if (bounds.width <= 0 || x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
            clearPending();
            return;
        }
        const direction = x < bounds.left + bounds.width / 2 ? -1 : 1;
        if (pending && pending.kind === contact.kind && pending.direction === direction
            && now - pending.completedAt <= PAIR_WINDOW_MS
            && Math.hypot(x - pending.x, y - pending.y) <= MAX_DISTANCE) {
            clearPending();
            options.double(direction);
            return;
        }
        resolveSingle();
        pending = { ...contact, x, y, direction, completedAt: now };
        // Allow the inclusive 500 ms boundary before expiring the candidate.
        singleTimer = setTimeout(resolveSingle, PAIR_WINDOW_MS + 1);
    }

    function cancel(id: number) {
        contacts.delete(id);
        clearPending();
    }

    function listen<T extends Event>(type: string, callback: (event: T) => void) {
        const listener = callback as EventListener;
        document.addEventListener(type, listener, { capture: true, passive: true });
        removers.push(() => document.removeEventListener(type, listener, true));
    }

    // Keep controls' existing handlers; only the bare playback surface joins pairs.
    if (window.PointerEvent) {
        listen<PointerEvent>('pointerdown', event => {
            if (event.pointerType !== 'touch' && event.pointerType !== 'mouse') return;
            if (event.pointerType === 'touch') ignoreMouseUntil = Date.now() + COMPATIBILITY_MOUSE_MS;
            begin(event.pointerId, event.pointerType, event.clientX, event.clientY, event.target,
                event.isPrimary && event.button === 0);
        });
        listen<PointerEvent>('pointermove', event => move(event.pointerId, event.clientX, event.clientY));
        listen<PointerEvent>('pointerup', event => {
            if (event.pointerType === 'touch') ignoreMouseUntil = Date.now() + COMPATIBILITY_MOUSE_MS;
            if (contacts.has(event.pointerId)) end(event.pointerId, event.clientX, event.clientY, event.target);
        });
        listen<PointerEvent>('pointercancel', event => cancel(event.pointerId));
    } else {
        listen<MouseEvent>('mousedown', event => begin(-1, 'mouse', event.clientX, event.clientY, event.target, event.button === 0));
        listen<MouseEvent>('mousemove', event => move(-1, event.clientX, event.clientY));
        listen<MouseEvent>('mouseup', event => {
            if (contacts.has(-1)) end(-1, event.clientX, event.clientY, event.target);
        });
        listen<TouchEvent>('touchstart', event => {
            ignoreMouseUntil = Date.now() + COMPATIBILITY_MOUSE_MS;
            Array.from(event.changedTouches).forEach(touch => {
                begin(touch.identifier, 'touch', touch.clientX, touch.clientY, event.target, event.touches.length === 1);
            });
        });
        listen<TouchEvent>('touchmove', event => {
            Array.from(event.changedTouches).forEach(touch => {
                move(touch.identifier, touch.clientX, touch.clientY);
            });
        });
        listen<TouchEvent>('touchend', event => {
            ignoreMouseUntil = Date.now() + COMPATIBILITY_MOUSE_MS;
            Array.from(event.changedTouches).forEach(touch => {
                if (contacts.has(touch.identifier)) end(touch.identifier, touch.clientX, touch.clientY, event.target);
            });
        });
        listen<TouchEvent>('touchcancel', event => {
            Array.from(event.changedTouches).forEach(touch => {
                cancel(touch.identifier);
            });
        });
    }

    return {
        reset,
        destroy() {
            reset();
            removers.forEach(remove => {
                remove();
            });
        }
    };
}
