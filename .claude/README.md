# 6-Agent Team Setup – Jellyfin Web Client

This directory contains the agent team charter and individual agent responsibilities for the modernized Jellyfin web client.

---

## **Quick Navigation**

### **Team Documentation**
- **[agent-team.md](agent-team.md)** – Global contract, team principles, shared architecture, quality gates, git workflow

### **Individual Agent Charters** (Read your assigned file!)

| Agent | File | Responsibility |
|-------|------|-----------------|
| **Agent 1** | [agent-1-api-contracts.md](agent-1-api-contracts.md) | Jellyfin API, DTO→domain mapping, TanStack Query |
| **Agent 2** | [agent-2-playback-wasm.md](agent-2-playback-wasm.md) | Playback orchestration, WebAudio, WASM audio |
| **Agent 3** | [agent-3-ui-systems.md](agent-3-ui-systems.md) | Radix UI, design tokens, motion, a11y |
| **Agent 4** | [agent-4-state-performance.md](agent-4-state-performance.md) | Router, Zustand, rendering perf, instrumentation |
| **Agent 5** | [agent-5-library-views.md](agent-5-library-views.md) | Library browsing, search, playlists, metadata editing |
| **Agent 6** | [agent-6-tooling-ci.md](agent-6-tooling-ci.md) | TypeScript strict, linting, tests, CI workflows |

---

## **Getting Started**

### 1. **Read Your Agent Charter**
   - Understand your primary responsibility
   - Review code ownership boundaries
   - Understand handoff triggers

### 2. **Read the Team Contract** (`agent-team.md`)
   - Global principles
   - Shared architecture defaults
   - Handoff protocol

### 3. **Run Local Quality Gates**
   ```bash
   npm install
   npm run lint && npm run type-check && npm run test
   ```

### 4. **Know Your Handoff Triggers**
   - Review the ownership map in `agent-team.md`
   - When you touch code outside your area, add cross-team handoff notes to PR description

---

## **Team Meetings & Sync**

### Daily Standup
- **5 min**: Each agent briefly mentions current task + any blockers
- **Focus**: "What might I need from another agent today?"

### Weekly Sync
- **30 min**: Review PRs awaiting cross-team approval
- **Discuss**: Major architectural changes or disagreements
- **Update**: Docs if patterns or contracts change

---

## **Code Ownership (CODEOWNERS)**

Use this template in `.github/CODEOWNERS`:

```
# src/lib/api/* → Agent 1
src/lib/api/**                          @agent-1
src/store/domain/**                     @agent-1
src/hooks/api/**                        @agent-1
src/types/**                            @agent-1
src/utils/query/**                      @agent-1

# src/controllers/playback/* → Agent 2
src/controllers/playback/**             @agent-2
src/audio-driver/**                     @agent-2
src/audio-wasm/**                       @agent-2

# src/ui-primitives/* → Agent 3
src/ui-primitives/**                    @agent-3
src/components/themeProvider/**         @agent-3
src/stories/**                          @agent-3
src/styles/**                           @agent-3

# src/routes/* → Agent 4
src/routes/**                           @agent-4
src/store/**                            @agent-4
src/index.tsx                           @agent-4
src/perf/**                             @agent-4

# src/components/{library,search,...} → Agent 5
src/components/library/**               @agent-5
src/components/search/**                @agent-5
src/components/playlisteditor/**        @agent-5
src/components/metadataEditor/**        @agent-5

# Build & CI → Agent 6
vite.config.ts                          @agent-6
eslint.config.mjs                       @agent-6
.github/workflows/**                    @agent-6
tests/**                                @agent-6
```

---

## **Key Commands (All Agents)**

```bash
# Local development
npm run serve                  # Vite dev server

# Quality gates (must pass before commit)
npm run lint                   # ESLint + stylelint
npm run type-check            # TypeScript strict mode
npm run test                  # Vitest (all tests)
npm run format:check          # Prettier

# Faster local validation (lint only changed)
npm run lint:changed
npm run test:related

# Pre-commit hook (automatic)
husky install                 # One-time setup

# CI simulation
npm run build:production
npm run escheck

# Component development
npm run storybook             # Browse components + a11y checks
```

---

## **Handoff Checklist**

When you modify code outside your primary area:

- [ ] I've read the owning agent's charter
- [ ] I've checked what might break for them
- [ ] I'll add a handoff note to the PR description:
  ```markdown
  ## 🔀 Cross-Team Handoff
  - **File**: src/store/xyz.ts
  - **Why**: [Explain change]
  - **Owning agent**: Agent [N]
  - **Follow-up**: [What they should verify]
  ```

---

## **Escalation Path**

1. **Technical Question** → Ask owning agent (read their charter first)
2. **Architecture Disagreement** → Discuss in async comment thread first
3. **Needs Team Alignment** → Bring to weekly sync
4. **Blocker** → Flag immediately in Slack/Discord

---

## **Document Updates**

Maintain these living documents:

- **docs/query-cookbook.md** – How to add API endpoints (Agent 1)
- **docs/playback-invariants.md** – Timing bounds, latency limits (Agent 2)
- **docs/ux-patterns.md** – Motion recipes, a11y patterns (Agent 3)
- **docs/refactor-playbook.md** – TS refactor guides (Agent 4)
- **docs/testing-guide.md** – Test strategies (Agent 6)

Update these docs whenever you change patterns or architecture.

---

## **Tech Stack Reference**

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.9 |
| Runtime | React | 19 |
| Server State | TanStack Query | 5 |
| Client State | Zustand | 5 |
| Routing | TanStack Router | 1.x |
| Data Tables | TanStack Table | 8 |
| Virtualization | TanStack Virtual | 3 |
| UI Components | Radix UI | 1.x |
| Icons | Radix Icons | 1.3 |
| Animations | Motion | 12 |
| Build | Vite | 7 |
| Testing | Vitest | 4 |
| API Client | Jellyfin SDK | 0.13 |
| Styling | Vanilla Extract | 1 |
| Audio/Video | WebAudio + WASM | Rust/wasm-pack |

---

## **FAQ**

### "Should I wait for Agent X to review before pushing?"
Follow CODEOWNERS rules in `.github/CODEOWNERS`. If a file is owned by Agent X, they must approve in PR.

### "Can I modify files outside my area?"
Yes, with caveats:
1. Keep changes minimal and localized
2. Add a handoff note
3. Run full test suite
4. Notify the owning agent in PR comment

### "What if I disagree with another agent's design?"
Comment on the PR/issue respectfully. If it's a blocker, escalate to team sync. The goal is alignment, not seniority.

### "How do I know if my change needs a test?"
If it touches: API mapping, state transitions, or playback logic, **yes**. If it's UI polish, use judgment but prefer tests for accessibility.

### "Bundle got too big. What do I do?"
1. Run `npm run analyze-bundle`
2. Identify the cause (new dependency? unused code?)
3. Discuss with Agent 6 if it's unavoidable
4. Split PR if possible

---

## **Onboarding Checklist**

- [ ] Read `agent-team.md` (team contract)
- [ ] Read your assigned agent charter
- [ ] Run `npm install && npm run lint && npm run type-check && npm run test`
- [ ] Set up pre-commit hook: `husky install`
- [ ] Configure `.github/CODEOWNERS` (one-time repo setup)
- [ ] Join team sync schedule (weekly)
- [ ] Bookmark `.claude/` directory for reference

---

## **Questions?**

Each agent charter includes:
- **Responsibilities** — what you own
- **Code Ownership** — files you must review
- **Quality Gates** — what must pass
- **Best Practices** — patterns to follow
- **Handoff Notes** — when to notify others
- **Failures You'll Catch** — red flags to watch for

**Start with your charter. It has everything you need.**

---

**Last updated:** 2026-01-26
**Team Version:** 1.0 (Initial Onboarding)
