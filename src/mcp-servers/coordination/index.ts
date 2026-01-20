import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { logger } from '../../utils/logger';

const server = new McpServer({
    name: 'jellyfin-coordination',
    version: '1.0.0'
});

interface ClaimedFile {
    file: string;
    agentId: string;
    agentName: string;
    branch: string;
    timestamp: number;
    heartbeat: number;
    intent?: string;
}

interface Agent {
    id: string;
    name: string;
    branch: string;
    lastHeartbeat: number;
    activeFiles: Set<string>;
    declaredIntents: Map<string, string[]>;
}

const state = {
    agents: new Map<string, Agent>(),
    claimedFiles: new Map<string, ClaimedFile>(),
    currentBranch: 'main'
};

function getTimestamp(): number {
    return Date.now();
}

function cleanupStaleClaims(maxAgeMs = 5 * 60 * 1000): void {
    const stale = getTimestamp() - maxAgeMs;
    for (const [file, claim] of state.claimedFiles) {
        if (claim.heartbeat < stale) {
            state.claimedFiles.delete(file);
            const agent = state.agents.get(claim.agentId);
            if (agent) {
                agent.activeFiles.delete(file);
            }
        }
    }
}

function cleanupStaleAgents(maxAgeMs = 5 * 60 * 1000): void {
    const stale = getTimestamp() - maxAgeMs;
    for (const [id, agent] of state.agents) {
        if (agent.lastHeartbeat < stale) {
            for (const file of agent.activeFiles) {
                state.claimedFiles.delete(file);
            }
            state.agents.delete(id);
        }
    }
}

function createTool(name: string, description: string, schema: object, handler: Function) {
    server.tool(name, description, schema, handler);
}

createTool(
    'register_agent',
    'Register an agent with the coordination system',
    {
        agentId: z.string().describe('Unique identifier for this agent'),
        agentName: z.string().describe('Human-readable name for the agent'),
        branch: z.string().default('main').describe('Git branch being worked on')
    },
    async ({ agentId, agentName, branch }) => {
        cleanupStaleClaims();

        const agent: Agent = {
            id: agentId,
            name: agentName,
            branch,
            lastHeartbeat: getTimestamp(),
            activeFiles: new Set(),
            declaredIntents: new Map()
        };

        state.agents.set(agentId, agent);
        state.currentBranch = branch;

        logger.info('Agent registered', { component: 'Coordination', agentId, agentName, branch });

        return {
            content: [{
                type: 'text',
                text: `Agent "${agentName}" (${agentId}) registered on branch "${branch}". Ready to claim files.`
            }]
        };
    }
);

createTool(
    'heartbeat',
    'Send a heartbeat to show the agent is still active',
    {
        agentId: z.string().describe('Agent identifier')
    },
    async ({ agentId }) => {
        const agent = state.agents.get(agentId);
        if (!agent) {
            return {
                content: [{
                    type: 'text',
                    text: `Agent ${agentId} not registered. Use register_agent first.`
                }]
            };
        }

        agent.lastHeartbeat = getTimestamp();

        for (const file of agent.activeFiles) {
            const claim = state.claimedFiles.get(file);
            if (claim) {
                claim.heartbeat = getTimestamp();
            }
        }

        return {
            content: [{
                type: 'text',
                text: `Heartbeat received for agent "${agent.name}". Active files: ${agent.activeFiles.size}`
            }]
        };
    }
);

createTool(
    'declare_intent',
    'Announce intent to work on specific files or features',
    {
        agentId: z.string().describe('Agent identifier'),
        feature: z.string().describe('Feature or component being worked on'),
        files: z.array(z.string()).describe('Files that will be modified')
    },
    async ({ agentId, feature, files }) => {
        const agent = state.agents.get(agentId);
        if (!agent) {
            return {
                content: [{
                    type: 'text',
                    text: `Agent ${agentId} not registered. Use register_agent first.`
                }]
            };
        }

        agent.declaredIntents.set(feature, files);

        const claimed = files.filter(f => state.claimedFiles.has(f));
        const available = files.filter(f => !state.claimedFiles.has(f));

        let message = `Agent "${agent.name}" declared intent to work on "${feature}".`;
        message += `\nFiles: ${files.join(', ')}`;

        if (claimed.length > 0) {
            message += `\n⚠️ Some files already claimed: ${claimed.join(', ')}`;
        }
        if (available.length > 0) {
            message += `\nAvailable files: ${available.join(', ')}`;
        }

        logger.info('Intent declared', { component: 'Coordination', agentId, feature, files });

        return {
            content: [{
                type: 'text',
                text: message
            }]
        };
    }
);

createTool(
    'claim_files',
    'Claim ownership of files to prevent conflicts',
    {
        agentId: z.string().describe('Agent identifier'),
        files: z.array(z.string()).describe('Files to claim'),
        intent: z.string().optional().describe('Optional description of what will be done')
    },
    async ({ agentId, files, intent }) => {
        const agent = state.agents.get(agentId);
        if (!agent) {
            return {
                content: [{
                    type: 'text',
                    text: `Agent ${agentId} not registered. Use register_agent first.`
                }]
            };
        }

        cleanupStaleClaims();

        const claimed: string[] = [];
        const alreadyClaimed: { file: string; owner: string }[] = [];

        for (const file of files) {
            const existing = state.claimedFiles.get(file);
            if (!existing) {
                state.claimedFiles.set(file, {
                    file,
                    agentId,
                    agentName: agent.name,
                    branch: agent.branch,
                    timestamp: getTimestamp(),
                    heartbeat: getTimestamp(),
                    intent
                });
                agent.activeFiles.add(file);
                claimed.push(file);
            } else if (existing.agentId !== agentId) {
                alreadyClaimed.push({
                    file,
                    owner: existing.agentName
                });
            } else {
                existing.heartbeat = getTimestamp();
                claimed.push(file);
            }
        }

        let message = `Agent "${agent.name}" claimed ${claimed.length} file(s): ${claimed.join(', ')}`;

        if (alreadyClaimed.length > 0) {
            message += `\n⚠️ Blocked - already claimed:`;
            for (const { file, owner } of alreadyClaimed) {
                message += `\n  - ${file} (by ${owner})`;
            }
            message += '\nUse request_permission to coordinate with the other agent.';
        }

        logger.info('Files claimed', { component: 'Coordination', agentId, files: claimed });

        return {
            content: [{
                type: 'text',
                text: message
            }]
        };
    }
);

createTool(
    'release_files',
    'Release ownership of files',
    {
        agentId: z.string().describe('Agent identifier'),
        files: z.array(z.string()).describe('Files to release')
    },
    async ({ agentId, files }) => {
        const agent = state.agents.get(agentId);
        if (!agent) {
            return {
                content: [{
                    type: 'text',
                    text: `Agent ${agentId} not registered.`
                }]
            };
        }

        const released: string[] = [];
        const notOwned: string[] = [];

        for (const file of files) {
            const claim = state.claimedFiles.get(file);
            if (claim && claim.agentId === agentId) {
                state.claimedFiles.delete(file);
                agent.activeFiles.delete(file);
                released.push(file);
            } else if (claim) {
                notOwned.push(file);
            }
        }

        let message = `Released ${released.length} file(s): ${released.join(', ')}`;

        if (notOwned.length > 0) {
            message += `\nNot owned by you: ${notOwned.join(', ')}`;
        }

        logger.info('Files released', { component: 'Coordination', agentId, files: released });

        return {
            content: [{
                type: 'text',
                text: message
            }]
        };
    }
);

createTool(
    'get_work_status',
    'Get current work status on the branch',
    {
        branch: z.string().optional().describe('Branch to check (default: current)')
    },
    async ({ branch }) => {
        cleanupStaleClaims();
        cleanupStaleAgents();

        const targetBranch = branch || state.currentBranch;
        const activeAgents: Agent[] = [];

        for (const agent of state.agents.values()) {
            if (agent.branch === targetBranch) {
                activeAgents.push(agent);
            }
        }

        let message = `# Work Status: ${targetBranch}\n`;
        message += `Active agents: ${activeAgents.length}\n\n`;

        if (activeAgents.length === 0) {
            message += 'No active agents. Safe to work on any files.';
        } else {
            for (const agent of activeAgents) {
                message += `## ${agent.name} (${agent.id})\n`;
                message += `Files: ${agent.activeFiles.size}\n`;
                if (agent.activeFiles.size > 0) {
                    message += '```\n';
                    message += Array.from(agent.activeFiles).join('\n');
                    message += '\n```\n';
                }

                if (agent.declaredIntents.size > 0) {
                    message += 'Intents:\n';
                    for (const [feature, files] of agent.declaredIntents) {
                        message += `- ${feature}: ${files.join(', ')}\n`;
                    }
                }
                message += '\n';
            }

            const claimedFiles = Array.from(state.claimedFiles.values());
            if (claimedFiles.length > 0) {
                message += `## Claimed Files (${claimedFiles.length})\n`;
                for (const claim of claimedFiles) {
                    const time = new Date(claim.timestamp).toLocaleTimeString();
                    message += `- \`${claim.file}\` - ${claim.agentName} (${time})`;
                    if (claim.intent) {
                        message += ` - ${claim.intent}`;
                    }
                    message += '\n';
                }
            }
        }

        return {
            content: [{
                type: 'text',
                text: message
            }]
        };
    }
);

createTool(
    'check_conflicts',
    'Check if files are being worked on by other agents',
    {
        agentId: z.string().describe('Agent identifier'),
        files: z.array(z.string()).describe('Files to check')
    },
    async ({ agentId, files }) => {
        const agent = state.agents.get(agentId);
        if (!agent) {
            return {
                content: [{
                    type: 'text',
                    text: `Agent ${agentId} not registered.`
                }]
            };
        }

        cleanupStaleClaims();

        const free: string[] = [];
        const claimed: { file: string; owner: string; intent?: string; timestamp: number }[] = [];

        for (const file of files) {
            const claim = state.claimedFiles.get(file);
            if (!claim) {
                free.push(file);
            } else if (claim.agentId !== agentId) {
                claimed.push({
                    file,
                    owner: claim.agentName,
                    intent: claim.intent,
                    timestamp: claim.timestamp
                });
            }
        }

        let message = `Conflict check for agent "${agent.name}":\n\n`;

        if (free.length > 0) {
            message += `✅ Free to work: ${free.join(', ')}\n\n`;
        }

        if (claimed.length > 0) {
            message += `⚠️ Claimed by others:\n`;
            for (const c of claimed) {
                const time = new Date(c.timestamp).toLocaleTimeString();
                message += `- \`${c.file}\` - ${c.owner} (${time})`;
                if (c.intent) message += ` - ${c.intent}`;
                message += '\n';
            }
            message += '\nConsider using request_permission to coordinate.';
        }

        return {
            content: [{
                type: 'text',
                text: message
            }]
        };
    }
);

createTool(
    'request_permission',
    'Request permission to override a file claim (for coordination)',
    {
        agentId: z.string().describe('Requesting agent identifier'),
        targetAgentId: z.string().describe('Agent whose claim to override'),
        files: z.array(z.string()).describe('Files to request'),
        reason: z.string().describe('Reason for the request')
    },
    async ({ agentId, targetAgentId, files, reason }) => {
        const requester = state.agents.get(agentId);
        const target = state.agents.get(targetAgentId);

        if (!requester) {
            return { content: [{ type: 'text', text: `Requester ${agentId} not registered.` }] };
        }
        if (!target) {
            return { content: [{ type: 'text', text: `Target agent ${targetAgentId} not found.` }] };
        }

        const message = `Permission request from "${requester.name}" to "${target.name}":\n`;
        const message2 = `Files: ${files.join(', ')}\nReason: ${reason}\n\n`;
        const message3 = `This is a coordination request. The target agent should run release_files when ready.`;

        logger.info('Permission requested', { component: 'Coordination', agentId, targetAgentId, files });

        return {
            content: [{
                type: 'text',
                text: message + message2 + message3
            }]
        };
    }
);

createTool(
    'deregister_agent',
    'Deregister an agent and release all claims',
    {
        agentId: z.string().describe('Agent identifier')
    },
    async ({ agentId }) => {
        const agent = state.agents.get(agentId);
        if (!agent) {
            return {
                content: [{
                    type: 'text',
                    text: `Agent ${agentId} not registered.`
                }]
            };
        }

        for (const file of agent.activeFiles) {
            state.claimedFiles.delete(file);
        }

        state.agents.delete(agentId);

        logger.info('Agent deregistered', { component: 'Coordination', agentId });

        return {
            content: [{
                type: 'text',
                text: `Agent "${agent.name}" deregistered. All claims released.`
            }]
        };
    }
);

createTool(
    'debug_state',
    'Get debug information about the coordination state',
    {},
    async () => {
        cleanupStaleClaims();

        const agents = Array.from(state.agents.values()).map(a => ({
            id: a.id,
            name: a.name,
            branch: a.branch,
            activeFiles: Array.from(a.activeFiles),
            intents: Array.from(a.declaredIntents.entries())
        }));

        const claims = Array.from(state.claimedFiles.values()).map(c => ({
            file: c.file,
            agent: c.agentName,
            timestamp: new Date(c.timestamp).toISOString()
        }));

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    currentBranch: state.currentBranch,
                    agentCount: state.agents.size,
                    claimedFileCount: state.claimedFiles.size,
                    agents,
                    claims
                }, null, 2)
            }]
        };
    }
);

async function main() {
    await server.connect(new StdioServerTransport());
    logger.info('Jellyfin Coordination MCP Server started', { component: 'Coordination' });
}

main().catch((err) => {
    logger.error('Failed to start MCP server', { component: 'Coordination', error: String(err) });
    process.exit(1);
});
