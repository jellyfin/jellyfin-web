import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-migrations',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_rollback_system_overview',
    'Get overview of the git-based rollback system architecture',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Git-based rollback system for safe migration recovery',
                    components: [
                        {
                            name: 'RollbackPoint',
                            description: 'Metadata about a saved state - phase name, commit hash, tag, files changed',
                            fields: ['phaseName', 'phaseNumber', 'commitHash', 'tagName', 'description', 'timestamp', 'filesChanged']
                        },
                        {
                            name: 'createRollbackPoint',
                            description: 'Creates git annotated tag before each migration phase',
                            process: ['Get current commit', 'Get changed files', 'Create tag name', 'Create annotated tag', 'Save to file']
                        },
                        {
                            name: 'rollbackToPoint',
                            description: 'Restores codebase to a saved rollback point',
                            process: ['Verify tag exists', 'Checkout tag', 'Create reverse commit', 'Update tag']
                        },
                        {
                            name: 'listRollbackPoints',
                            description: 'Lists all available rollback points',
                            storage: 'rollbacks.json in project root'
                        }
                    ],
                    tagNaming: 'rollback-{phaseNumber}-{phaseName}-{timestamp}',
                    storage: 'JSON file + git annotated tags'
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_rollback_workflow',
    'Understand the rollback workflow and decision process',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    workflow: {
                        beforeMigration: [
                            '1. createRollbackPoint() before phase starts',
                            '2. Tag created with phase metadata',
                            '3. RollbackPoint saved to rollbacks.json',
                            '4. Migration proceeds'
                        ],
                        onFailure: [
                            '1. Call rollbackToPoint() with tag name',
                            '2. System verifies tag exists',
                            '3. Checkout to tagged commit',
                            '4. Create reverse commit (revert changes)',
                            '5. Update tag to new commit',
                            '6. Return success/failure'
                        ],
                        verification: [
                            '1. verifyRollbackSystem() checks integrity',
                            '2. Validates tag exists and is accessible',
                            '3. Confirms file structure is intact',
                            '4. Reports system health'
                        ]
                    },
                    options: {
                        force: 'Override safety checks',
                        keepChanges: 'Preserve local modifications during rollback'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_rollback_data_structure',
    'Get the TypeScript interfaces and data structures',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    RollbackPoint: {
                        phaseName: 'string - Name of the migration phase',
                        phaseNumber: 'number - Sequential phase identifier',
                        commitHash: 'string - Git commit SHA before migration',
                        tagName: 'string - Git tag name for this rollback point',
                        description: 'string - Human-readable description',
                        timestamp: 'number - Unix timestamp when created',
                        filesChanged: 'string[] - List of modified files'
                    },
                    RollbackOptions: {
                        force: 'boolean - Skip safety checks (optional)',
                        keepChanges: 'boolean - Preserve local modifications (optional)'
                    },
                    RollbackResult: {
                        success: 'boolean - Whether rollback succeeded',
                        rollbackPoint: 'RollbackPoint | undefined - The point restored to',
                        error: 'string | undefined - Error message if failed',
                        previousState: 'string | undefined - Description of previous state'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_migration_patterns',
    'Understand patterns used in migration system',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    patterns: [
                        {
                            name: 'Git-based Snapshots',
                            description: 'Uses git tags and commits instead of file backups',
                            benefits: ['Full history', 'Easy comparison', 'No storage bloat']
                        },
                        {
                            name: 'Annotated Tags',
                            description: 'Tags contain metadata about the phase',
                            content: ['Phase name', 'Description', 'Commit hash', 'Changed files']
                        },
                        {
                            name: 'Reverse Commits',
                            description: 'Rollback creates inverse commits, not just checkout',
                            purpose: 'Preserves history while reversing changes'
                        },
                        {
                            name: 'Dual Storage',
                            description: 'Metadata in both git tags and JSON file',
                            reason: 'Git tags for restoration, JSON for quick listing'
                        }
                    ],
                    safetyMechanisms: [
                        'Tag existence verification before rollback',
                        'Phase number validation',
                        'Optional force flag for emergencies',
                        'Verification function for system integrity'
                    ],
                    errorHandling: [
                        'Failed git commands return descriptive errors',
                        'Missing tags handled gracefully',
                        'Partial rollbacks prevented',
                        'Logging at each step for debugging'
                    ]
                }, null, 2)
            }]
        };
    }
);

server.resource(
    'rollback-system-docs',
    'jellyfin://migrations/rollback-system',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://migrations/rollback-system',
                mimeType: 'text/markdown',
                text: `# Jellyfin Rollback System

## Overview
Git-based rollback system for safe migration recovery. Creates snapshots before each migration phase.

## Architecture
\`\`\`
┌─────────────────────┐
│  Migration Phase    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ createRollbackPoint │────▶│  Git Annotated Tag  │
│                     │     │  + rollbacks.json   │
└─────────────────────┘     └─────────────────────┘
          │
          │ If Issues
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│  rollbackToPoint    │────▶│  Restored State     │
│  (with verification)│     │  + Reverse Commit   │
└─────────────────────┘     └─────────────────────┘
\`\`\`

## Key Concepts

### Rollback Point
A snapshot containing:
- Phase name and number
- Git commit hash
- Git tag reference
- List of changed files
- Timestamp

### Tag Naming Convention
\`\`\`
rollback-{phaseNumber}-{phaseName}-{timestamp}
Example: rollback-3-state-migration-1704067200000
\`\`\`

## Workflow

### Creating a Rollback Point
\`\`\`typescript
const point = await createRollbackPoint(
    'State Migration',
    3,
    'Migrating from legacy audioStore to new mediaStore'
);
\`\`\`

### Rolling Back
\`\`\`typescript
const result = await rollbackToPoint('rollback-3-...-1704067200000');
if (result.success) {
    console.log('Restored to:', result.rollbackPoint?.phaseName);
}
\`\`\`

## Safety Features

1. **Tag Verification** - Confirms tag exists before attempting rollback
2. **Phase Validation** - Ensures rollback is to expected phase
3. **Reverse Commits** - Preserves git history while reversing
4. **Verification** - \`verifyRollbackSystem()\` checks integrity

## Files
- \`src/migrations/rollback.ts\` - Main implementation
- \`rollbacks.json\` - Rollback point registry
- Git tags in repository
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
