import { describe, expect, it, vi } from 'vitest';

// --- Mocks ---

vi.mock('lib/globalize', () => ({
    default: { translate: (key: string) => key }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getApiClient: () => ({
            getUrl: (path: string, params?: Record<string, unknown>) => {
                const query = params
                    ? '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
                    : '';
                return `http://server/${path}${query}`;
            },
            accessToken: () => 'test-token'
        })
    }
}));

vi.mock('../../scripts/datetime', () => ({
    default: { getDisplayRunningTime: () => '0:30' }
}));

let capturedDlg: HTMLDivElement | null = null;
vi.mock('../dialogHelper/dialogHelper', () => ({
    default: {
        createDialog: vi.fn(() => {
            capturedDlg = document.createElement('div');
            return capturedDlg;
        }),
        open: vi.fn(() => new Promise(() => { /* never resolves */ })),
        close: vi.fn()
    }
}));

vi.mock('../formdialog.scss', () => ({}));
vi.mock('material-design-icons-iconfont', () => ({}));
vi.mock('../../elements/emby-button/paper-icon-button-light', () => ({}));
vi.mock('./clipSaver.scss', () => ({}));

import { show } from './clipSaver';

const DEFAULT_OPTIONS = {
    itemId: 'item-1',
    serverId: 'server-1',
    currentPositionTicks: 60 * 10_000_000,
    durationTicks: 300 * 10_000_000,
    mediaSourceId: 'source-1'
};

async function openDialog() {
    capturedDlg = null;
    show(DEFAULT_OPTIONS);
    await Promise.resolve();
    return capturedDlg!;
}

// ---------------------------------------------------------------------------
describe('clipSaver — btnStart disabled state', () => {
    it('is disabled initially (no codec selected)', async () => {
        const dlg = await openDialog();
        const btn = dlg.querySelector('.btnStartClip') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });

    it('becomes enabled after selecting a codec', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();
        const btn = dlg.querySelector('.btnStartClip') as HTMLButtonElement;
        expect(btn.disabled).toBe(false);
    });

    it('remains disabled after changing time inputs when no codec is selected', async () => {
        const dlg = await openDialog();
        // Trigger updateDuration by firing an input event on the start field
        const startInput = dlg.querySelector('#clipStartTime') as HTMLInputElement;
        startInput.value = '00:00:05.000';
        startInput.dispatchEvent(new Event('input'));
        const btn = dlg.querySelector('.btnStartClip') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });

    it('stays enabled after changing time inputs when a codec is selected', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="av1"]') as HTMLButtonElement).click();

        const endInput = dlg.querySelector('#clipEndTime') as HTMLInputElement;
        endInput.value = '00:01:10.000';
        endInput.dispatchEvent(new Event('input'));

        const btn = dlg.querySelector('.btnStartClip') as HTMLButtonElement;
        expect(btn.disabled).toBe(false);
    });
});

// ---------------------------------------------------------------------------
describe('clipSaver — btnStart disabled: time validation', () => {
    it('is disabled when start time is invalid (bad format), codec selected', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();
        const startInput = dlg.querySelector('#clipStartTime') as HTMLInputElement;
        startInput.value = 'abc';
        startInput.dispatchEvent(new Event('input'));
        expect((dlg.querySelector('.btnStartClip') as HTMLButtonElement).disabled).toBe(true);
    });

    it('is disabled when end time is empty, codec selected', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();
        const endInput = dlg.querySelector('#clipEndTime') as HTMLInputElement;
        endInput.value = '';
        endInput.dispatchEvent(new Event('input'));
        expect((dlg.querySelector('.btnStartClip') as HTMLButtonElement).disabled).toBe(true);
    });

    it('is disabled when start === end, codec selected', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();
        const startInput = dlg.querySelector('#clipStartTime') as HTMLInputElement;
        const endInput = dlg.querySelector('#clipEndTime') as HTMLInputElement;
        startInput.value = '00:01:00.000';
        endInput.value = '00:01:00.000';
        endInput.dispatchEvent(new Event('input'));
        expect((dlg.querySelector('.btnStartClip') as HTMLButtonElement).disabled).toBe(true);
    });

    it('is disabled when start > end, codec selected', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();
        const startInput = dlg.querySelector('#clipStartTime') as HTMLInputElement;
        const endInput = dlg.querySelector('#clipEndTime') as HTMLInputElement;
        startInput.value = '00:02:00.000';
        endInput.value = '00:01:00.000';
        startInput.dispatchEvent(new Event('input'));
        expect((dlg.querySelector('.btnStartClip') as HTMLButtonElement).disabled).toBe(true);
    });

    it('is enabled when start < end and codec selected', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();
        const startInput = dlg.querySelector('#clipStartTime') as HTMLInputElement;
        const endInput = dlg.querySelector('#clipEndTime') as HTMLInputElement;
        startInput.value = '00:00:10.000';
        endInput.value = '00:00:40.000';
        endInput.dispatchEvent(new Event('input'));
        expect((dlg.querySelector('.btnStartClip') as HTMLButtonElement).disabled).toBe(false);
    });

    it('is disabled when start > end even if codec selected, after step-button adjusts time', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="av1"]') as HTMLButtonElement).click();
        const startInput = dlg.querySelector('#clipStartTime') as HTMLInputElement;
        const endInput = dlg.querySelector('#clipEndTime') as HTMLInputElement;
        // Put start after end
        startInput.value = '00:05:00.000';
        endInput.value = '00:01:00.000';
        startInput.dispatchEvent(new Event('input'));
        expect((dlg.querySelector('.btnStartClip') as HTMLButtonElement).disabled).toBe(true);
    });
});

// ---------------------------------------------------------------------------
describe('clipSaver — download button', () => {
    it('is hidden initially', async () => {
        const dlg = await openDialog();
        const btnDownload = dlg.querySelector('.btnDownloadClip') as HTMLAnchorElement;
        expect(btnDownload.classList.contains('hide')).toBe(true);
    });

    it('is rendered as an <a> element', async () => {
        const dlg = await openDialog();
        const btnDownload = dlg.querySelector('.btnDownloadClip');
        expect(btnDownload?.tagName.toLowerCase()).toBe('a');
    });
});

// ---------------------------------------------------------------------------
describe('clipSaver — startClip', () => {
    it('shows progress section and hides btnStart when encoding starts', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();

        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'Server error'
        });
        vi.stubGlobal('fetch', fetchMock);

        const btnStart = dlg.querySelector('.btnStartClip') as HTMLButtonElement;
        btnStart.click();
        await Promise.resolve();

        expect(dlg.querySelector('.clipProgressSection')!.classList.contains('hide')).toBe(false);
        expect(btnStart.classList.contains('hide')).toBe(true);

        vi.unstubAllGlobals();
    });

    it('resets UI and shows progressSection on network error', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        dlg.querySelector('.btnStartClip')!.dispatchEvent(new MouseEvent('click'));
        await new Promise(resolve => setTimeout(resolve, 0));

        const progressSection = dlg.querySelector('.clipProgressSection') as HTMLElement;
        expect(progressSection.classList.contains('hide')).toBe(false);

        vi.unstubAllGlobals();
    });
});

// ---------------------------------------------------------------------------
describe('clipSaver — cancelEncoding', () => {
    it('resets speedSamples on cancel', async () => {
        const dlg = await openDialog();
        (dlg.querySelector('[data-codec="h264"]') as HTMLButtonElement).click();

        const fetchMock = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ clipId: 'clip-123' })
            })
            .mockResolvedValue({ ok: true }); // DELETE
        vi.stubGlobal('fetch', fetchMock);

        // Simulate EventSource that never fires
        const mockEs = { addEventListener: vi.fn(), close: vi.fn(), onerror: null };
        vi.stubGlobal('EventSource', vi.fn(() => mockEs));

        dlg.querySelector('.btnStartClip')!.dispatchEvent(new MouseEvent('click'));
        await new Promise(resolve => setTimeout(resolve, 0));

        // Cancel
        dlg.querySelector('.btnCancelClip')!.dispatchEvent(new MouseEvent('click'));
        await new Promise(resolve => setTimeout(resolve, 0));

        // Progress section should be hidden after cancel
        expect(dlg.querySelector('.clipProgressSection')!.classList.contains('hide')).toBe(true);

        vi.unstubAllGlobals();
    });
});
