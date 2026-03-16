import dialogHelper from '../dialogHelper/dialogHelper';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import datetime from '../../scripts/datetime';
import '../formdialog.scss';
import 'material-design-icons-iconfont';
import '../../elements/emby-button/paper-icon-button-light';
import './clipSaver.scss';
import { TICKS_PER_SECOND, ticksToTimeString, timeStringToTicks, formatEtaSeconds } from './clipSaverTime';
import { buildHtml } from './clipSaverDialog';

interface ClipSaverOptions {
    itemId: string;
    serverId: string;
    currentPositionTicks: number;
    durationTicks: number;
    mediaSourceId: string;
    audioStreamIndex?: number;
}

export async function show(options: ClipSaverOptions): Promise<void> {
    const apiClient = ServerConnections.getApiClient(options.serverId);

    const dur = Number(options.durationTicks) || 0;
    const pos = Number(options.currentPositionTicks) || 0;

    const dlg = dialogHelper.createDialog({
        removeOnClose: true,
        scrollY: false,
        size: 'small',
        enableHistory: false
    });
    dlg.classList.add('formDialog', 'clipSaverDialog');

    const startTicks = Math.max(0, pos - 30 * TICKS_PER_SECOND);
    const endTicks = dur > 0 ? Math.min(dur, pos) : pos;

    dlg.innerHTML = buildHtml(startTicks, endTicks);

    const startInput = dlg.querySelector('#clipStartTime') as HTMLInputElement;
    const endInput = dlg.querySelector('#clipEndTime') as HTMLInputElement;
    const durationDisplay = dlg.querySelector('.clipDurationValue') as HTMLElement;
    const validationMsg = dlg.querySelector('.clipValidation') as HTMLElement;
    const progressSection = dlg.querySelector('.clipProgressSection') as HTMLElement;
    const progressFill = dlg.querySelector('.clipProgressFill') as HTMLElement;
    const progressPercent = dlg.querySelector('.clipProgressPercent') as HTMLElement;
    const progressLabel = dlg.querySelector('.clipProgressLabel') as HTMLElement;
    const btnStart = dlg.querySelector('.btnStartClip') as HTMLButtonElement;
    const btnCancelClip = dlg.querySelector('.btnCancelClip') as HTMLButtonElement;
    const btnDownload = dlg.querySelector('.btnDownloadClip') as HTMLAnchorElement;
    const progressEta = dlg.querySelector('.clipProgressEta') as HTMLElement;
    const stepButtons = dlg.querySelectorAll('.clipStepBtn');
    const codecButtons = dlg.querySelectorAll('.clipCodecBtn');

    let eventSource: EventSource | null = null;
    let currentClipId: string | null = null;
    let downloadLink: string | null = null;
    let selectedCodec: string | null = null;
    let fetchAbortController: AbortController | null = null;

    function isSaveEnabled(): boolean {
        if (selectedCodec === null) return false;
        const start = timeStringToTicks(startInput.value);
        const end = timeStringToTicks(endInput.value);
        if (start === null || end === null) return false;
        return end > start;
    }

    btnStart.disabled = !isSaveEnabled();
    const speedSamples: Array<{ time: number; percent: number }> = [];
    const SPEED_SAMPLES = 8;

    /**
     * Update the ETA display given the current progress percent (0-100).
     * Uses a sliding window of speed samples (delta_percent / delta_time).
     */
    function updateEta(percent: number): void {
        if (percent < 1) {
            progressEta.textContent = '';
            return;
        }

        const now = Date.now();
        speedSamples.push({ time: now, percent });
        if (speedSamples.length > SPEED_SAMPLES) speedSamples.shift();
        if (speedSamples.length < 2) return;

        const oldest = speedSamples[0];
        const deltaPercent = percent - oldest.percent;
        const deltaTimeMs = now - oldest.time;

        if (deltaPercent <= 0) return;

        const speedPctPerMs = deltaPercent / deltaTimeMs;
        const etaMs = (100 - percent) / speedPctPerMs;

        progressEta.textContent = globalize.translate(
            'ClipEta',
            formatEtaSeconds(etaMs / 1000)
        );
    }

    function stepTime(input: HTMLInputElement, deltaTicks: number, minTicks: number, maxTicks: number): void {
        const current = timeStringToTicks(input.value);
        if (current === null) return;
        const next = Math.max(
            minTicks,
            Math.min(maxTicks, current + deltaTicks)
        );
        input.value = ticksToTimeString(next);
        updateDuration();
    }

    function updateDuration() {
        const start = timeStringToTicks(startInput.value);
        const end = timeStringToTicks(endInput.value);

        if (start === null || end === null) {
            durationDisplay.textContent = '--:--';
            btnStart.disabled = !isSaveEnabled();
            return;
        }

        const diff = end - start;
        if (diff <= 0) {
            durationDisplay.textContent = '--:--';
            btnStart.disabled = !isSaveEnabled();
            return;
        }

        durationDisplay.textContent = datetime.getDisplayRunningTime(diff);

        if (downloadLink) invalidateEncodedClip();

        btnStart.disabled = !isSaveEnabled();
    }

    function validate() {
        const start = timeStringToTicks(startInput.value);
        const end = timeStringToTicks(endInput.value);

        validationMsg.classList.add('hide');

        if (start === null) {
            showValidation(globalize.translate('ClipInvalidStartTime'));
            return false;
        }
        if (end === null) {
            showValidation(globalize.translate('ClipInvalidEndTime'));
            return false;
        }
        if (start >= end) {
            showValidation(globalize.translate('ClipStartMustBeBeforeEnd'));
            return false;
        }
        if (start < 0) {
            showValidation(globalize.translate('ClipStartMustBePositive'));
            return false;
        }
        if (dur > 0 && end > dur) {
            showValidation(globalize.translate('ClipEndBeyondDuration'));
            return false;
        }

        return true;
    }

    function showValidation(msg: string): void {
        validationMsg.textContent = msg;
        validationMsg.classList.remove('hide');
    }

    function setStepButtonsDisabled(disabled: boolean): void {
        stepButtons.forEach((btn) => {
            (btn as HTMLButtonElement).disabled = disabled;
        });
    }

    function resetEncodingUI() {
        startInput.disabled = false;
        endInput.disabled = false;
        btnStart.disabled = !isSaveEnabled();
        btnStart.classList.remove('hide');
        btnCancelClip.classList.add('hide');
        setStepButtonsDisabled(false);
    }

    function closeEventSource() {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    }

    function cleanup() {
        closeEventSource();
        fetchAbortController?.abort();
        fetchAbortController = null;
        currentClipId = null;
    }

    function invalidateEncodedClip() {
        downloadLink = null;
        btnDownload.classList.add('hide');
        progressSection.classList.add('hide');
        btnStart.classList.remove('hide');
    }

    async function cancelEncoding() {
        if (!currentClipId) return;

        const clipIdToCancel = currentClipId;
        closeEventSource();

        try {
            const url = apiClient.getUrl(
                `Videos/${options.itemId}/Clip/${clipIdToCancel}`
            );
            await fetch(url, {
                method: 'DELETE',
                headers: {
                    Authorization: `MediaBrowser Token="${apiClient.accessToken()}"`
                }
            });
        } catch {
            // Ignore errors on cancel — the process is already being killed server-side
        }

        currentClipId = null;
        speedSamples.length = 0;

        // Reset progress UI, keep modal open
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        progressLabel.textContent = globalize.translate('ClipEncoding') + '...';
        progressEta.textContent = '';
        progressSection.classList.add('hide');

        showValidation(globalize.translate('ClipCancelled'));

        resetEncodingUI();
    }

    async function startClip() {
        if (!validate()) return;

        const startTimeTicks = timeStringToTicks(startInput.value);
        const endTimeTicks = timeStringToTicks(endInput.value);
        const audioStreamIndex = options.audioStreamIndex ?? 0;

        // Disable inputs, show progress
        startInput.disabled = true;
        endInput.disabled = true;
        btnStart.disabled = true;
        btnStart.classList.add('hide');
        btnCancelClip.classList.remove('hide');
        setStepButtonsDisabled(true);
        validationMsg.classList.add('hide');
        progressSection.classList.remove('hide');
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        progressLabel.textContent = globalize.translate('ClipEncoding') + '...';
        progressEta.textContent = '';
        speedSamples.length = 0;

        btnDownload.classList.add('hide');

        try {
            fetchAbortController = new AbortController();
            const url = apiClient.getUrl(`Videos/${options.itemId}/Clip`, {
                startTimeTicks: startTimeTicks,
                endTimeTicks: endTimeTicks,
                mediaSourceId: options.mediaSourceId,
                audioStreamIndex: audioStreamIndex,
                videoCodec: selectedCodec
            });
            const response = await fetch(url, {
                method: 'POST',
                signal: fetchAbortController.signal,
                headers: {
                    Authorization: `MediaBrowser Token="${apiClient.accessToken()}"`
                }
            });
            fetchAbortController = null;

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            const result = await response.json();
            const clipId = result.clipId;
            currentClipId = clipId;

            const sseUrl = apiClient.getUrl(
                `Videos/${options.itemId}/Clip/${clipId}/Progress`,
                {
                    ApiKey: apiClient.accessToken()
                }
            );

            // eslint-disable-next-line compat/compat
            eventSource = new EventSource(sseUrl);

            eventSource.addEventListener('progress', function (e) {
                const percent = Number.parseFloat(e.data);
                if (!Number.isNaN(percent)) {
                    progressFill.style.width = `${Math.min(percent, 100)}%`;
                    progressPercent.textContent = `${Math.round(percent)}%`;
                    updateEta(percent);
                }
            });

            eventSource.addEventListener('complete', function () {
                cleanup();
                progressFill.style.width = '100%';
                progressPercent.textContent = '100%';
                progressLabel.textContent = globalize.translate('ClipComplete');
                progressEta.textContent = '';
                btnCancelClip.classList.add('hide');

                startInput.disabled = false;
                endInput.disabled = false;
                setStepButtonsDisabled(false);

                downloadLink = apiClient.getUrl(
                    `Videos/${options.itemId}/Clip/${clipId}/Download`,
                    { ApiKey: apiClient.accessToken() }
                );
                btnDownload.href = downloadLink;
                btnDownload.classList.remove('hide');
            });

            eventSource.addEventListener('error', function (e) {
                if (!eventSource) return;
                cleanup();
                const errorData = (e as MessageEvent).data;
                progressLabel.textContent = errorData
                    ? globalize.translate('ClipFailed')
                    : globalize.translate('ClipConnectionLost');
                if (errorData) progressPercent.textContent = errorData;
                progressFill.style.width = '0%';
                progressSection.classList.remove('hide');
                resetEncodingUI();
            });
        } catch (err) {
            cleanup();
            progressLabel.textContent = globalize.translate('ClipFailed');
            progressPercent.textContent = err instanceof Error ? err.message : String(err);
            progressSection.classList.remove('hide');
            resetEncodingUI();
        }
    }

    (dlg.querySelector('.btnCancel') as HTMLButtonElement).addEventListener('click', () => {
        cleanup();
        dialogHelper.close(dlg);
    });

    codecButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            codecButtons.forEach((b) => b.classList.remove('clipCodecBtn--active'));
            btn.classList.add('clipCodecBtn--active');
            selectedCodec = (btn as HTMLElement).dataset.codec ?? null;

            if (downloadLink) invalidateEncodedClip();

            btnStart.disabled = !isSaveEnabled();
        });
    });

    btnStart.addEventListener('click', startClip);
    btnCancelClip.addEventListener('click', cancelEncoding);

    startInput.addEventListener('input', updateDuration);
    endInput.addEventListener('input', updateDuration);

    function attachStepButton(btn: HTMLButtonElement, input: HTMLInputElement, delta: number): void {
        let initialTimer: ReturnType<typeof setTimeout> | null = null;
        let repeatInterval: ReturnType<typeof setInterval> | null = null;

        function doStep() {
            stepTime(input, delta, 0, dur || Infinity);
        }

        function stop() {
            if (initialTimer !== null) clearTimeout(initialTimer);
            if (repeatInterval !== null) clearInterval(repeatInterval);
            initialTimer = null;
            repeatInterval = null;
        }

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            doStep();
            initialTimer = setTimeout(() => {
                repeatInterval = setInterval(doStep, 50);
            }, 400);
        });

        btn.addEventListener('pointerup', stop);
        btn.addEventListener('pointerleave', stop);
        btn.addEventListener('pointercancel', stop);
    }

    attachStepButton(
        dlg.querySelector('.btnStartMinus') as HTMLButtonElement,
        startInput,
        -TICKS_PER_SECOND
    );
    attachStepButton(
        dlg.querySelector('.btnStartPlus') as HTMLButtonElement,
        startInput,
        +TICKS_PER_SECOND
    );
    attachStepButton(
        dlg.querySelector('.btnEndMinus') as HTMLButtonElement,
        endInput,
        -TICKS_PER_SECOND
    );
    attachStepButton(
        dlg.querySelector('.btnEndPlus') as HTMLButtonElement,
        endInput,
        +TICKS_PER_SECOND
    );

    updateDuration();

    await dialogHelper.open(dlg);
    cleanup();
}

export default {
    show
};
