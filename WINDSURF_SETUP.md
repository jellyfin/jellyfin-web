# Windsurf Development Setup for Jellyfin Web

## 🎯 Overview
This document describes the complete Windsurf development environment setup for contributing to Jellyfin Web.

## 📁 Project Structure
```
.windsurf/
├── rules/                          # Cascade behavior rules
│   ├── jellyfin-official-guidelines.md    # Official Jellyfin guidelines
│   ├── jellyfin-react-guidelines.md       # React/TypeScript standards
│   ├── js-ts-coding-standards.md          # JS/TS coding rules
│   ├── security-guidelines.md             # Security best practices
│   ├── testing-standards.md               # Testing guidelines
│   ├── styling-guidelines.md              # CSS/SCSS standards
│   ├── media-handling-guidelines.md       # Media player guidelines
│   ├── git-workflow-guidelines.md         # Git workflow rules
│   └── jellyfin-architecture-standards.md # Architecture patterns
└── workflows/                      # Cascade workflows
    ├── jellyfin-security-check.md         # Security audit workflow
    ├── jellyfin-pr-preparation.md         # PR preparation workflow
    ├── test-pr.md                          # Test others' PRs workflow
    └── create-issue.md                     # Create new issues workflow
```

## 🔧 MCP Servers Configuration
Located in: `~/.codeium/windsurf/mcp_config.json`

### Active Servers:
- **GitHub MCP**: Access to Jellyfin repositories with personal token
- **Filesystem MCP**: Project file management
- **Web Search MCP**: Documentation and solution search
- **Memory MCP**: Context persistence across sessions

## 📋 Rules Summary

### Always Active Rules:
- **jellyfin-official-guidelines**: Official development standards
- **jellyfin-react-guidelines**: React/TypeScript best practices
- **security-guidelines**: Security requirements
- **jellyfin-architecture-standards**: Project architecture patterns

### File-Specific Rules:
- **js-ts-coding-standards**: Applied to `*.{js,ts,jsx,tsx}` files
- **testing-standards**: Applied to `*.{test,spec}.*` files
- **styling-guidelines**: Applied to `*.{css,scss,styled.*}` files

### Context-Aware Rules:
- **git-workflow-guidelines**: Applied during Git operations
- **media-handling-guidelines**: Applied when working with media components

## 🚀 Workflows Usage

### Security Check:
```
/jellyfin-security-check
```
Runs comprehensive security audit and dependency analysis.

### PR Preparation:
```
/jellyfin-pr-preparation
```
Prepares code for pull request submission following Jellyfin standards.

### Test Pull Request:
```
/test-pr
```
Test and review pull requests from other contributors.

### Create Issue:
```
/create-issue
```
Create well-structured issues following Jellyfin guidelines.

## 🛠️ VS Code Integration

### Tasks Available:
- `Jellyfin: Install Dependencies`
- `Jellyfin: Start Development Server`
- `Jellyfin: Build Production`
- `Jellyfin: Run Tests`
- `Jellyfin: Lint Code`
- `Jellyfin: Security Audit`
- `Jellyfin: Full Check` (runs all checks)

### Settings Configured:
- 4-space indentation (matching Jellyfin standards)
- ESLint and Stylelint auto-fix on save
- Proper file associations and validation
- Git integration optimized

## 📚 Key Development Standards

### Issue Workflow:
- Browse issues list for work within your skill-set
- Comment on issues to state intent (avoid duplication)
- Create issues first if none exist for your changes
- Reference issues in PRs with keywords (fixes #123, closes #456)
- Focus on labeled issues matching your expertise

### Repository Setup:
- Follow "fork, feature-branch, and PR" model
- Add yourself to CONTRIBUTORS.md for first contribution
- Always target master branch (except emergency hotfixes)
- Test thoroughly - no PR should break master

### Code Style:
- 4 spaces indentation
- Single quotes for strings
- No trailing commas
- Semicolons required
- camelCase for variables, PascalCase for components

### Import Standards:
- Direct imports for tree-shaking
- Grouped imports (external → internal → types)
- Absolute imports for src/ paths

### Git Workflow:
- Fork → Feature Branch → PR model
- Imperative mood commit messages
- Squash junk commits before PR
- Reference issues in commits

### Architecture:
- Bulletproof React structure
- Feature-based organization in src/apps/
- Avoid deprecated directories (src/controllers, src/scripts)
- Proper separation of concerns

## 🔍 Quick Commands

### Development:
```bash
npm start                    # Start dev server
npm run build:production     # Production build
npm test                     # Run tests
npm run lint                 # Lint code
npm audit                    # Security audit
```

### Git Workflow:
```bash
git fetch --all
git rebase upstream/master
git checkout -b feature-name master
# Make changes...
git push --set-upstream origin feature-name
```

## 📞 Support
- Use `/jellyfin-security-check` for security issues
- Use `/jellyfin-pr-preparation` before submitting PRs
- Reference official Jellyfin documentation: https://jellyfin.org/docs/
- GitHub repository: https://github.com/jellyfin/jellyfin-web

## 🎉 Ready to Contribute!
Your development environment is now fully configured with Jellyfin's official standards and best practices. Happy coding! 🚀