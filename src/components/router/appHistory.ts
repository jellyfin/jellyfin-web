import type { History } from 'history';

let appHistory: History | null = null;

export const setAppHistory = (history: History) => {
    appHistory = history;
};

export const getAppHistory = (): History | null => appHistory;
