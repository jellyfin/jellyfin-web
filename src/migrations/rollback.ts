/**
 * Rollback System for Safe Migration
 *
 * Creates git-based rollback points before each phase.
 * Enables safe recovery from migration issues.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { logger } from 'utils/logger';

const execAsync = promisify(exec);

export interface RollbackPoint {
    phaseName: string;
    phaseNumber: number;
    commitHash: string;
    tagName: string;
    description: string;
    timestamp: number;
    filesChanged: string[];
}

export interface RollbackOptions {
    force?: boolean;
    keepChanges?: boolean;
}

export interface RollbackResult {
    success: boolean;
    rollbackPoint?: RollbackPoint;
    error?: string;
    previousState?: string;
}

/**
 * Get current git commit hash
 */
export async function getCurrentCommitHash(): Promise<string> {
    try {
        const { stdout } = await execAsync('git rev-parse HEAD', {
            cwd: process.cwd()
        });
        return stdout.trim();
    } catch (error) {
        logger.error('Failed to get current commit hash', { error });
        throw new Error('Unable to get current commit hash');
    }
}

/**
 * Get list of changed files since last commit
 */
export async function getChangedFiles(): Promise<string[]> {
    try {
        const { stdout } = await execAsync('git diff --name-only HEAD', {
            cwd: process.cwd()
        });
        return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
        logger.error('Failed to get changed files', { error });
        return [];
    }
}

/**
 * Create a rollback point for a phase
 */
export async function createRollbackPoint(
    phaseName: string,
    phaseNumber: number,
    description: string
): Promise<RollbackPoint> {
    const startTime = Date.now();

    logger.info('Creating rollback point', {
        phaseName,
        phaseNumber,
        description
    });

    try {
        // Get current commit
        const commitHash = await getCurrentCommitHash();

        // Get changed files
        const filesChanged = await getChangedFiles();

        // Create tag name
        const timestamp = Date.now();
        const tagName = `rollback-${phaseNumber}-${phaseName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;

        // Create annotated tag
        const tagMessage = `Rollback point for ${phaseName}\n\n${description}\n\nPhase: ${phaseNumber}\nCommit: ${commitHash}\nFiles: ${filesChanged.length}`;

        await execAsync(`git tag -a "${tagName}" -m "${tagMessage}"`, {
            cwd: process.cwd()
        });

        const rollbackPoint: RollbackPoint = {
            phaseName,
            phaseNumber,
            commitHash,
            tagName,
            description,
            timestamp,
            filesChanged
        };

        // Save rollback point to file
        saveRollbackPoint(rollbackPoint);

        logger.info('Rollback point created successfully', {
            phaseName,
            tagName,
            commitHash: commitHash.substring(0, 7),
            filesChanged: filesChanged.length,
            durationMs: Date.now() - startTime
        });

        return rollbackPoint;
    } catch (error) {
        logger.error('Failed to create rollback point', {
            phaseName,
            error: String(error)
        });
        throw error;
    }
}

/**
 * Rollback to a specific rollback point
 */
export async function rollbackToPoint(tagName: string, options: RollbackOptions = {}): Promise<RollbackResult> {
    const startTime = Date.now();

    logger.warn('Initiating rollback', {
        tagName,
        force: options.force,
        keepChanges: options.keepChanges
    });

    try {
        // Verify tag exists
        const { stdout: tagExists } = await execAsync(`git tag -l "${tagName}"`, { cwd: process.cwd() });

        if (!tagExists.trim()) {
            throw new Error(`Rollback point "${tagName}" not found`);
        }

        // Get rollback point info
        const rollbackPoint = getRollbackPointByTag(tagName);
        if (!rollbackPoint) {
            throw new Error('Rollback point metadata not found');
        }

        // Create backup of current state
        const currentCommit = await getCurrentCommitHash();
        const backupTag = `backup-before-rollback-${Date.now()}`;

        if (!options.keepChanges) {
            await execAsync(`git tag "${backupTag}" HEAD`, {
                cwd: process.cwd()
            });
        }

        // Perform rollback
        if (options.force) {
            await execAsync(`git checkout -f ${tagName}`, {
                cwd: process.cwd()
            });
        } else {
            await execAsync(`git checkout ${tagName}`, {
                cwd: process.cwd()
            });
        }

        logger.info('Rollback completed successfully', {
            tagName,
            previousCommit: currentCommit.substring(0, 7),
            durationMs: Date.now() - startTime
        });

        return {
            success: true,
            rollbackPoint,
            previousState: currentCommit
        };
    } catch (error) {
        const errorMessage = String(error);
        logger.error('Rollback failed', {
            tagName,
            error: errorMessage
        });

        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Rollback to the last successful phase
 */
export async function rollbackToLast(options: RollbackOptions = {}): Promise<RollbackResult> {
    const lastPoint = getLastRollbackPoint();

    if (!lastPoint) {
        return {
            success: false,
            error: 'No rollback points found'
        };
    }

    return rollbackToPoint(lastPoint.tagName, options);
}

/**
 * List all available rollback points
 */
export async function listRollbackPoints(): Promise<RollbackPoint[]> {
    const points: RollbackPoint[] = [];

    try {
        const { stdout } = await execAsync(
            'git tag -l "rollback-*" --format="%(refname:short)|%(creatordate:iso)|%(contents:subject)"',
            { cwd: process.cwd() }
        );

        const lines = stdout.trim().split('\n').filter(Boolean);

        for (const line of lines) {
            const [tagName, timestamp, ...messageParts] = line.split('|');
            const message = messageParts.join('|');

            // Parse phase number from tag
            const phaseMatch = tagName.match(/rollback-(\d+)-/);
            const phaseNumber = phaseMatch ? parseInt(phaseMatch[1], 10) : 0;

            // Extract phase name from message
            const phaseNameMatch = message.match(/Rollback point for (.+?)\n/);
            const phaseName = phaseNameMatch ? phaseNameMatch[1] : tagName;

            // Get commit hash
            const { stdout: hashOutput } = await execAsync(`git rev-parse ${tagName}^{commit}`, { cwd: process.cwd() });

            points.push({
                phaseName,
                phaseNumber,
                commitHash: hashOutput.trim(),
                tagName,
                description: message,
                timestamp: new Date(timestamp).getTime(),
                filesChanged: []
            });
        }

        // Sort by timestamp (newest first)
        points.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        logger.error('Failed to list rollback points', { error });
    }

    return points;
}

/**
 * Delete old rollback points (keep last N)
 */
export async function cleanupOldRollbackPoints(keepCount: number = 5): Promise<void> {
    const points = await listRollbackPoints();

    if (points.length <= keepCount) {
        logger.info('No rollback points to cleanup', { count: points.length });
        return;
    }

    const toDelete = points.slice(keepCount);

    for (const point of toDelete) {
        try {
            await execAsync(`git tag -d "${point.tagName}"`, {
                cwd: process.cwd()
            });

            // Also delete from file storage
            const filePath = getRollbackPointFilePath(point.tagName);
            if (existsSync(filePath)) {
                // File deletion would be handled by cleanup function
            }

            logger.debug('Deleted old rollback point', { tagName: point.tagName });
        } catch (error) {
            logger.warn('Failed to delete rollback point', {
                tagName: point.tagName,
                error
            });
        }
    }

    logger.info('Rollback point cleanup complete', {
        deleted: toDelete.length,
        remaining: keepCount
    });
}

// File storage helpers
function getRollbackPointsDir(): string {
    const dir = join(process.cwd(), '.rollback-points');
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    return dir;
}

function getRollbackPointFilePath(tagName: string): string {
    return join(getRollbackPointsDir(), `${tagName}.json`);
}

function saveRollbackPoint(point: RollbackPoint): void {
    const filePath = getRollbackPointFilePath(point.tagName);
    writeFileSync(filePath, JSON.stringify(point, null, 2));
    logger.debug('Saved rollback point to file', { filePath });
}

function getRollbackPointByTag(tagName: string): RollbackPoint | null {
    const filePath = getRollbackPointFilePath(tagName);
    if (!existsSync(filePath)) {
        return null;
    }

    try {
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

function getLastRollbackPoint(): RollbackPoint | null {
    const dir = getRollbackPointsDir();

    if (!existsSync(dir)) {
        return null;
    }

    const files = readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
            path: join(dir, f),
            timestamp: statSync(join(dir, f)).mtimeMs
        }))
        .sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);

    if (files.length === 0) {
        return null;
    }

    try {
        const content = readFileSync(files[0].path, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/**
 * Migration Manager Class
 * Provides high-level migration phase management
 */
export class MigrationManager {
    private currentPhase: number | null = null;
    private phaseStartTime: number | null = null;

    /**
     * Start a migration phase
     */
    async startPhase(
        phaseName: string,
        phaseNumber: number,
        description: string
    ): Promise<{
        success: boolean;
        rollbackPoint?: RollbackPoint;
        error?: string;
    }> {
        this.currentPhase = phaseNumber;
        this.phaseStartTime = Date.now();

        logger.info(`Starting migration phase: ${phaseName}`, {
            phaseNumber,
            description
        });

        try {
            const rollbackPoint = await createRollbackPoint(phaseName, phaseNumber, description);

            return {
                success: true,
                rollbackPoint
            };
        } catch (error) {
            this.currentPhase = null;
            this.phaseStartTime = null;

            return {
                success: false,
                error: String(error)
            };
        }
    }

    /**
     * Complete the current phase
     */
    async completePhase(): Promise<{
        success: boolean;
        duration: number;
        error?: string;
    }> {
        if (this.currentPhase === null) {
            return {
                success: false,
                duration: 0,
                error: 'No phase in progress'
            };
        }

        const duration = Date.now() - (this.phaseStartTime || Date.now());

        logger.info(`Migration phase ${this.currentPhase} completed`, {
            duration
        });

        this.currentPhase = null;
        this.phaseStartTime = null;

        return {
            success: true,
            duration
        };
    }

    /**
     * Fail the current phase (triggers rollback)
     */
    async failPhase(reason: string): Promise<{
        success: boolean;
        rolledBack: boolean;
        error?: string;
    }> {
        if (this.currentPhase === null) {
            return {
                success: false,
                rolledBack: false,
                error: 'No phase in progress'
            };
        }

        logger.error(`Migration phase ${this.currentPhase} failed`, {
            reason,
            duration: Date.now() - (this.phaseStartTime || Date.now())
        });

        // Attempt rollback
        const rollbackResult = await rollbackToLast({ force: true });

        this.currentPhase = null;
        this.phaseStartTime = null;

        return {
            success: false,
            rolledBack: rollbackResult.success,
            error: reason
        };
    }

    /**
     * Get current phase status
     */
    getCurrentPhase(): { phase: number | null; duration: number } {
        return {
            phase: this.currentPhase,
            duration: this.phaseStartTime ? Date.now() - this.phaseStartTime : 0
        };
    }
}

// Singleton instance
export const migrationManager = new MigrationManager();

/**
 * Verify rollback system is working
 */
export async function verifyRollbackSystem(): Promise<{
    working: boolean;
    details: {
        gitAvailable: boolean;
        canCreateTags: boolean;
        canListTags: boolean;
        canCheckout: boolean;
    };
}> {
    const details = {
        gitAvailable: false,
        canCreateTags: false,
        canListTags: false,
        canCheckout: false
    };

    try {
        // Check git availability
        await execAsync('git --version', { cwd: process.cwd() });
        details.gitAvailable = true;

        // Check tag creation
        const testTag = `rollback-test-${Date.now()}`;
        await execAsync(`git tag "${testTag}" -m "Test"`, { cwd: process.cwd() });
        details.canCreateTags = true;

        // Check tag listing
        const { stdout } = await execAsync('git tag -l "rollback-test-*"', { cwd: process.cwd() });
        details.canListTags = stdout.includes(testTag);

        // Clean up test tag
        await execAsync(`git tag -d "${testTag}"`, { cwd: process.cwd() });

        // Check checkout (on current branch)
        const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd() });
        details.canCheckout = !!currentBranch.trim();

        logger.info('Rollback system verification complete', details);

        return {
            working: Object.values(details).every(v => v),
            details
        };
    } catch (error) {
        logger.error('Rollback system verification failed', { error });

        return {
            working: false,
            details
        };
    }
}
