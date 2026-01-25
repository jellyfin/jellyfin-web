/**
 * Toast Store
 *
 * Zustand store for managing toast notifications.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ToastData {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
    readonly variant?: 'success' | 'error' | 'warning' | 'info';
    readonly duration?: number;
    readonly action?: {
        readonly label: string;
        readonly onClick: () => void;
    };
    readonly createdAt: number;
}

export interface ToastState {
    toasts: readonly ToastData[];
    toast: (data: Omit<ToastData, 'id' | 'createdAt'>) => string;
    dismiss: (id: string) => void;
    update: (id: string, data: Partial<Omit<ToastData, 'id' | 'createdAt'>>) => void;
}

const TOAST_LIMIT = 5;

let counter = 0;
function generateId(): string {
    counter += 1;
    return `toast-${counter}-${Date.now()}`;
}

export const useToastStore = create<ToastState>()(
    subscribeWithSelector((set, get) => ({
        toasts: [],

        toast: data => {
            const id = generateId();
            const toast: ToastData = {
                id,
                ...data,
                createdAt: Date.now()
            };

            set(state => {
                const newToasts = [...state.toasts, toast];
                if (newToasts.length > TOAST_LIMIT) {
                    return { toasts: newToasts.slice(-TOAST_LIMIT) };
                }
                return { toasts: newToasts };
            });

            // Auto dismiss after duration
            if (data.duration !== 0) {
                setTimeout(() => {
                    get().dismiss(id);
                }, data.duration || 5000);
            }

            return id;
        },

        dismiss: id => {
            set(state => ({
                toasts: state.toasts.filter(t => t.id !== id)
            }));
        },

        update: (id, data) => {
            set(state => ({
                toasts: state.toasts.map(t => (t.id === id ? { ...t, ...data } : t))
            }));
        }
    }))
);

// Hooks for compatibility
export const useToast = () =>
    useToastStore(state => ({
        toast: state.toast,
        dismiss: state.dismiss,
        update: state.update,
        toasts: state.toasts
    }));
