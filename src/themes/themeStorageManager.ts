import { StorageManager } from '@mui/material/styles';

import Events, { type Event } from 'utils/events';
import { EventType } from 'types/eventType';

/**
 * A custom MUI StorageManager.
 *
 * Since we switch the theme based on the current page, we handle getting/setting the current theme via autoTheme +
 * themeManager. We need to implement `subscribe` so MUI is aware of theme changes though otherwise the `useTheme` hook
 * will always return the default theme.
 */
export const ThemeStorageManager: StorageManager = () => ({
    get: defaultValue => defaultValue,
    set: () => { /* no-op */ },
    subscribe: handler => {
        const wrappedHandler = (_e: Event, value: string) => handler(value);
        Events.on(document, EventType.THEME_CHANGE, wrappedHandler);
        return () => Events.off(document, EventType.THEME_CHANGE, wrappedHandler);
    }
});
