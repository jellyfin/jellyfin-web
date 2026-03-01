import { describe, expect, it } from 'vitest';

import {
    detectVrProjection,
    normalizeVrProjection,
    resolveVrProjection
} from '../../../../../plugins/htmlVideoPlayer/vrPlayback';

describe('vrPlayback helpers', () => {
    it('normalizes unknown projection values to off', () => {
        expect(normalizeVrProjection('not-a-projection')).toBe('off');
    });

    it('detects projection from Video3DFormat metadata', () => {
        expect(detectVrProjection({
            Video3DFormat: 'HalfSideBySide'
        })).toBe('half-sbs');

        expect(detectVrProjection({
            Video3DFormat: 'FullTopAndBottom'
        })).toBe('full-tab');
    });

    it('detects fisheye projection from file naming patterns', () => {
        expect(detectVrProjection({
            Name: 'Dive Fisheye VR180 SBS'
        })).toBe('fisheye-sbs');
    });

    it('resolves auto mode using per-item metadata', () => {
        expect(resolveVrProjection('auto', {
            Name: 'Documentary OU 3D'
        })).toBe('half-tab');
    });

    it('keeps explicit mode when not using auto', () => {
        expect(resolveVrProjection('half-sbs', {
            Name: 'Movie TAB'
        })).toBe('half-sbs');
    });
});
