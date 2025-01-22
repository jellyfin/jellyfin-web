import taskbutton from '@/scripts/taskbutton'; // Import the function

export declare global {
    interface Window {
        TaskButton: undefined | typeof taskbutton;
        appMode: undefined | string
    }
}
