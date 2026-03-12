import { describe, expect, it, vi } from 'vitest';

vi.mock('lib/globalize', () => ({
    default: { translate: (key: string) => key }
}));

import { buildHtml } from './clipSaverDialog';

const START_TICKS = 10 * 10_000_000; // 00:00:10.000
const END_TICKS = 40 * 10_000_000; // 00:00:40.000

describe('buildHtml()', () => {
    it('Should inject the start time value', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).toContain('value="00:00:10.000"');
    });

    it('Should inject the end time value', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).toContain('value="00:00:40.000"');
    });

    it('Should contain the required input ids', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).toContain('id="clipStartTime"');
        expect(html).toContain('id="clipEndTime"');
    });

    it('Should contain all action buttons', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).toContain('btnStartClip');
        expect(html).toContain('btnCancelClip');
        expect(html).toContain('btnDownloadClip');
    });

    it('Should hide cancel and download buttons initially', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).toContain('btnCancelClip hide');
        expect(html).toContain('btnDownloadClip hide');
    });

    it('Should contain the progress section hidden initially', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).toContain('clipProgressSection hide');
    });

    it('Should contain the three codec buttons', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).toContain('data-codec="h264"');
        expect(html).toContain('data-codec="h265"');
        expect(html).toContain('data-codec="av1"');
    });

    it('Should render no codec button as active by default', () => {
        const html = buildHtml(START_TICKS, END_TICKS);
        expect(html).not.toContain('clipCodecBtn--active');
    });
});
