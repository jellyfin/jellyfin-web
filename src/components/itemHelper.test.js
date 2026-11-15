import { describe, expect, it, vi } from 'vitest';

vi.mock('./apphost', () => ({
    appHost: {
        getDefaultLayout: () => 'desktop',
        supports: () => false,
        appName: () => 'Jellyfin Web'
    }
}));

vi.mock('lib/globalize', () => ({
    default: { translate: (key) => key }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        currentApiClient: () => undefined,
        getApiClient: () => undefined
    }
}));

const { canShareLink } = await import('./itemHelper');

describe('itemHelper.canShareLink', () => {
    const videoItem = { Type: 'Movie', MediaType: 'Video', Path: '/media/movie.mkv' };

    it('Should allow a normal item when the server allows sharing', () => {
        expect(canShareLink(videoItem, { CanShareMedia: true })).toBe(true);
    });

    it('Should hide sharing when the server policy disables it', () => {
        expect(canShareLink(videoItem, { CanShareMedia: false })).toBe(false);
    });

    it('Should fail closed when the flag is missing or not a boolean', () => {
        // An older server that does not send the field must not surface an action
        // that the API would reject with SharingDisabled.
        expect(canShareLink(videoItem, {})).toBe(false);
        expect(canShareLink(videoItem, { CanShareMedia: 'true' })).toBe(false);
        expect(canShareLink(videoItem, { CanShareMedia: 1 })).toBe(false);
    });

    it('Should keep item rules when no user is supplied', () => {
        expect(canShareLink(videoItem)).toBe(true);
    });

    it('Should still reject item types that cannot be shared', () => {
        expect(canShareLink({ Type: 'TvChannel' }, { CanShareMedia: true })).toBe(false);
        expect(canShareLink({ Type: 'Program' }, { CanShareMedia: true })).toBe(false);
    });

    it('Should reject an unfinished recording even when sharing is allowed', () => {
        expect(canShareLink({ Type: 'Recording', Status: 'InProgress' }, { CanShareMedia: true })).toBe(false);
        expect(canShareLink({ Type: 'Recording', Status: 'Completed' }, { CanShareMedia: true })).toBe(true);
    });
});
