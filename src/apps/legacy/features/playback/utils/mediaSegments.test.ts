import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models/media-segment-dto';
import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';
import { describe, expect, it } from 'vitest';

import { findCurrentSegment } from './mediaSegments';

const TEST_SEGMENTS: MediaSegmentDto[] = [
    {
        Id: 'intro',
        Type: MediaSegmentType.Intro,
        StartTicks: 0,
        EndTicks: 10
    },
    {
        Id: 'preview',
        Type: MediaSegmentType.Preview,
        StartTicks: 20,
        EndTicks: 30
    },
    {
        Id: 'recap',
        Type: MediaSegmentType.Recap,
        StartTicks: 30,
        EndTicks: 40
    },
    {
        Id: 'commercial',
        Type: MediaSegmentType.Commercial,
        StartTicks: 40,
        EndTicks: 50
    },
    {
        Id: 'outro',
        Type: MediaSegmentType.Outro,
        StartTicks: 50,
        EndTicks: 60
    }
];

describe('findCurrentSegment()', () => {
    it('Should return the current segment', () => {
        let segmentDetails = findCurrentSegment(TEST_SEGMENTS, 23);
        expect(segmentDetails).toBeDefined();
        expect(segmentDetails?.index).toBe(1);
        expect(segmentDetails?.segment?.Id).toBe('preview');

        segmentDetails = findCurrentSegment(TEST_SEGMENTS, 5, 1);
        expect(segmentDetails).toBeDefined();
        expect(segmentDetails?.index).toBe(0);
        expect(segmentDetails?.segment?.Id).toBe('intro');

        segmentDetails = findCurrentSegment(TEST_SEGMENTS, 42, 3);
        expect(segmentDetails).toBeDefined();
        expect(segmentDetails?.index).toBe(3);
        expect(segmentDetails?.segment?.Id).toBe('commercial');
    });

    it('Should return undefined if not in a segment', () => {
        let segmentDetails = findCurrentSegment(TEST_SEGMENTS, 16);
        expect(segmentDetails).toBeUndefined();

        segmentDetails = findCurrentSegment(TEST_SEGMENTS, 10, 1);
        expect(segmentDetails).toBeUndefined();

        segmentDetails = findCurrentSegment(TEST_SEGMENTS, 100);
        expect(segmentDetails).toBeUndefined();
    });
});
