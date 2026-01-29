/**
 * Controllers Index Tests
 *
 * Verifies the index file exists and has proper structure.
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('Controllers Index', () => {
    it('index file exists', () => {
        const indexPath = path.resolve(__dirname, '../index.ts');
        expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('index file has content', () => {
        const indexPath = path.resolve(__dirname, '../index.ts');
        const content = fs.readFileSync(indexPath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
    });

    it('index exports from expected directories', () => {
        const indexPath = path.resolve(__dirname, '../index.ts');
        const content = fs.readFileSync(indexPath, 'utf-8');

        expect(content).toContain("from './session/login/Login'");
        expect(content).toContain("from './session/selectServer/SelectServer'");
        expect(content).toContain("from './list/ListView'");
        expect(content).toContain("from './movies/Movies'");
        expect(content).toContain("from './music/MusicAlbums'");
        expect(content).toContain("from './shows/TVShows'");
        expect(content).toContain("from './livetv/LiveTV'");
        expect(content).toContain("from './search/Search'");
        expect(content).toContain("from './dashboard/Settings'");
    });
});
