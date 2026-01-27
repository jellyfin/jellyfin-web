# Agent Quick Reference Card

Print this or bookmark it. Use it as your daily reference.

---

## **Your Role & Scope**

| Agent | Primary Responsibility | Files | Approval Needed For |
|-------|------------------------|-------|-------------------|
| **1** | API + DTOs + Query | `src/lib/api/*` `src/store/domain/*` | Jellyfin endpoints, mappers, Query hooks |
| **2** | Playback + WASM | `src/controllers/playback/*` `src/audio-*/*` | Playback controller API, audio graph, WASM |
| **3** | UI + Design + Motion | `src/ui-primitives/*` `src/stories/*` | New components, tokens, motion recipes |
| **4** | Router + State + Perf | `src/routes/*` `src/store/*` | Routing, Zustand design, perf changes |
| **5** | Library Views | `src/components/{library,search,*}/*` | Browsing UX, search, metadata editing |
| **6** | Quality + CI | `vite.config.ts` `.github/workflows/*` | Linting rules, TS config, tests |

---

## **Before Starting Work**

```bash
# 1. Make sure repo is clean
git status                    # Nothing uncommitted

# 2. Pull latest
git pull origin master        # Or current working branch

# 3. Install dependencies
npm install

# 4. Run full quality gates
npm run lint && npm run type-check && npm run test
```

---

## **During Development**

### Daily Loop
```bash
# As you work
npm run serve                 # Dev server (localhost:5173)

# Before each commit
npm run lint:changed          # Fast lint on changed files
npm run test:related          # Fast test on related tests

# These run automatically via pre-commit hook
# (if `husky install` was run)
```

### Debugging
```bash
# Performance profiling
npm run test:coverage
npm run analyze-bundle        # See bundle composition

# Component development
npm run storybook             # Browse/test components

# Type checking only
npm run type-check

# Full test run
npm run test
```

---

## **Before Committing**

### Checklist
- [ ] Code compiles: `npm run type-check` ✅
- [ ] Linting passes: `npm run lint` ✅
- [ ] Tests pass: `npm run test` ✅
- [ ] No `any` without `@ts-ignore` comment
- [ ] Handoff notes added (if cross-team)
- [ ] Tests added for business logic

### Commit Message Format
```
feat: Add new API endpoint for search filters
fix: Correct playback timing on mobile
refactor: Extract usePlayerState hook
docs: Update query cookbook
perf: Virtualize large library lists
test: Add contract tests for item mapper
ci: Update ESLint rules for no-console
```

---

## **Before Creating PR**

### Checklist
- [ ] Branched from `master`
- [ ] Full test suite passes: `npm run test`
- [ ] Build succeeds: `npm run build:check`
- [ ] No linting warnings: `npm run lint`
- [ ] Bundle size check: `npm run analyze-bundle`
- [ ] Handoff notes in PR description (if applicable)

### PR Template
```markdown
## 🎯 What does this do?
[Brief description]

## 🔄 How was it tested?
- [ ] Unit tests added/updated
- [ ] Manual testing (describe)
- [ ] CI passing

## 🔀 Cross-Team Handoff (if applicable)
- **Files changed**: src/xyz/*
- **Owning agent**: Agent [N]
- **Why**: [Rationale]
- **Follow-up**: [What they should verify]
```

---

## **When You Need Something From Another Agent**

1. **Read their charter** (`.claude/agent-[n]-*.md`)
2. **Check ownership** (`.claude/agent-team.md`)
3. **Comment on issue/PR** with:
   - What you need
   - Why (context)
   - Suggested approach (optional)
   - Link to discussion

### Example
```
@agent-2 — Need a new PlaybackController method for seeking to percentage instead of absolute time.

Issue: #123 wants to show progress bar with relative percentages

Proposal: Add `seekToPercent(0..1): Promise<void>` method

Context: Used in Library > Now Playing UI (src/components/nowPlayingBar/)
```

---

## **Common Commands Cheat Sheet**

```bash
# Daily commands
npm run serve              # Start dev server
npm run lint:changed       # Fast lint
npm run test:related       # Fast tests

# Before commit
npm run lint               # Full lint
npm run type-check         # TypeScript
npm run test               # Full tests

# Debugging
npm run storybook          # Component browser
npm run analyze-bundle     # Bundle size
npm run test:coverage      # Coverage report

# Building
npm run build:check        # Verify build
npm run build:production   # Production build

# Git
git branch                 # See all branches
git pull origin master     # Sync with main
git status                 # Check uncommitted changes
```

---

## **Handoff Checklist**

**When modifying code outside your area:**

- [ ] I read the owning agent's charter (their file in `.claude/`)
- [ ] I checked what might break for them
- [ ] I ran full test suite: `npm run test`
- [ ] I added handoff note to PR:

```markdown
## 🔀 Cross-Team Handoff
- **File**: src/routes/library.tsx
- **Why**: Removed deprecated useLibraryState hook
- **Owner**: Agent 4
- **Verify**: That new useStore(state => state.library) works correctly
```

---

## **Red Flags** (Stop and Ask)

🚩 **Before proceeding, ask the owning agent:**

- Modifying API endpoint structure (→ Agent 1)
- Changing PlaybackController API (→ Agent 2)
- Adding/removing UI components (→ Agent 3)
- Restructuring state/routes (→ Agent 4)
- Changing library browsing UX (→ Agent 5)
- Updating lint/test rules (→ Agent 6)

---

## **Escalation Path**

1. **Quick question** → Ask in PR comment or team Slack
2. **Need guidance** → Tag the owning agent
3. **Architectural concern** → Bring to weekly sync
4. **Blocker** → Flag immediately to team lead

---

## **Files You'll Touch Often**

| Agent | Frequent Edits | Reference |
|-------|---|---|
| **1** | `src/lib/api/jellyfinClient.ts` | `docs/query-cookbook.md` |
| **2** | `src/controllers/playback/PlaybackController.ts` | `docs/playback-invariants.md` |
| **3** | `src/ui-primitives/atoms/*/` | `src/stories/index.stories.mdx` |
| **4** | `src/store/*.ts` | `docs/refactor-playbook.md` |
| **5** | `src/components/library/*.tsx` | `src/routes/library/*` |
| **6** | `eslint.config.mjs` | `.github/workflows/` |

---

## **Useful Links** (Bookmark These)

- **Jellyfin SDK Docs**: https://jellyfin.org/docs/general/clients/web-config.html
- **TanStack Query Docs**: https://tanstack.com/query/latest
- **Radix UI Docs**: https://www.radix-ui.com/
- **Motion Docs**: https://motion.dev/
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **React 19 Docs**: https://react.dev/
- **Vitest Docs**: https://vitest.dev/

---

## **Team Sync Schedule**

- **Daily Standup**: [Time/Link]
- **Weekly Sync**: [Day/Time/Link]
- **Code Review**: Async via GitHub PRs

---

## **Emergency Contact**

- **Build broken**: Ping @agent-6 (tooling)
- **API sync failed**: Ping @agent-1 (API contracts)
- **Playback issue**: Ping @agent-2 (playback)
- **UI/UX question**: Ping @agent-3 (UI systems)
- **State/routing issue**: Ping @agent-4 (state)
- **Feature implementation blocked**: Ping @agent-5 (library views)

---

## **One More Thing**

✅ **Before you start your first task:**

1. Read `/.claude/agent-team.md` (global contract)
2. Read `/.claude/agent-[your-number]-*.md` (your charter)
3. Run `npm install && npm run lint && npm run type-check && npm run test`
4. Run `husky install` (one-time setup)
5. Bookmark this file
6. Join the team sync

---

**You've got this. Let's build something great.**

Last updated: 2026-01-26
