import type { RouterHistory } from '@tanstack/react-router';

let appHistory: RouterHistory | null = null;

export const setAppHistory = (history: RouterHistory) => {
    appHistory = history;
};

export const getAppHistory = (): RouterHistory | null => appHistory;
