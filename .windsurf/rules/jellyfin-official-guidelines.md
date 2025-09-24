---
name: "jellyfin-official-guidelines"
activation: "Always On"
description: "Official Jellyfin development guidelines from jellyfin.org and jellyfin-web repository"
---

# Official Jellyfin Development Guidelines

<project_structure>
- Follow the new Bulletproof React architecture structure under src/apps/
- Most new code should be organized under the appropriate app directory unless it is common/shared
- Directory structure:
  - src/apps/dashboard (Admin dashboard app)
  - src/apps/experimental (New experimental app)
  - src/apps/stable (Classic stable app)
  - src/apps/wizard (Startup wizard app)
  - src/components (Higher order visual components and React components)
  - src/hooks (Custom React hooks)
  - src/utils (Utility functions)
  - src/types (Common TypeScript interfaces/types)
</project_structure>

<deprecated_directories>
- Do NOT create new files in these deprecated directories:
  - src/controllers (Legacy page views and controllers) ❌
  - src/scripts (Random assortment of visual components and utilities) ❌
- These need cleanup but avoid when possible:
  - src/elements (Basic webcomponents and React equivalents) 🧹
</deprecated_directories>

<pull_request_guidelines>
- Write good titles in imperative mood: "Add LDAP support" not "Added LDAP support"
- Keep titles short but descriptive (will become changelog entries)
- Use proper capitalization but no punctuation in titles
- Squash "junk" commits together before submitting PR
- Single commit should cover single significant change
- Don't leave "fixed this", "whoops typo" commits in branch history
- Write detailed PR body explaining:
  - Why changes are being made (reference issues with keywords: fixes, closes, addresses)
  - How you approached the issue and describe changes for large PRs
- Mark unfinished PRs as "draft" - forgetting this may result in PR being ignored
- Avoid rebasing and force-pushing after reviews (forces unnecessary re-reviews)
- All PRs to dev require at least one approving review from admin team member
- PRs to master require review by at least two team members before merging
- Expect review and discussion - be prepared to defend your changes
- Inactive WIP PRs may be closed if no response to team inquiries
</pull_request_guidelines>

<commit_message_standards>
- Follow https://chris.beams.io/posts/git-commit/ guidelines
- Use imperative mood in subject line
- Separate subject from body with blank line
- Limit subject line to 50 characters
- Capitalize subject line
- Do not end subject line with period
- Use body to explain what and why, not how
</commit_message_standards>

<code_style_eslint>
- Follow ESLint configuration exactly (eslint.config.mjs)
- Use 4 spaces for indentation (not tabs)
- Use single quotes for strings, avoid template literals unless needed
- Use semicolons at end of statements
- Use trailing commas never (comma-dangle: never)
- Use 1TBS brace style with single line allowed
- Maximum 7 parameters per function
- Use camelCase for variables and functions, PascalCase for types and components
- Use UPPER_CASE for constants
- Prefer const over let, never use var
- Use curly braces for multi-line control structures
- No nested ternary operators
- No unused variables or expressions
- Use explicit return types for functions
</code_style_eslint>

<editor_config_standards>
- Use space indentation (4 spaces for most files, 2 for JSON/YAML)
- Use UTF-8 charset
- Trim trailing whitespace
- Insert final newline
- Use LF line endings
</editor_config_standards>

<import_standards>
- Use direct file imports for tree-shaking:
  - ❌ import { Button } from '@mui/material'
  - ✅ import Button from '@mui/material/Button'
- Same applies to @mui/icons-material and @jellyfin/sdk imports
- Group imports in order:
  1. External libraries (react, @mui/material, etc.)
  2. Internal utilities and hooks  
  3. Component imports
  4. Type-only imports (import type)
- Use absolute imports for src/ directory paths
- Avoid deep relative imports (../../..)
</import_standards>

<react_specific_rules>
- Use React 18 functional components with hooks exclusively
- Use JSX filename extensions (.jsx, .tsx)
- No JSX binding in render (react/jsx-no-bind)
- No useless fragments (react/jsx-no-useless-fragment)
- No array index as key (react/no-array-index-key)
- Follow hooks rules (react-hooks/rules-of-hooks)
- Follow exhaustive deps rule (react-hooks/exhaustive-deps)
- Use single quotes for JSX attributes
</react_specific_rules>

<typescript_specific_rules>
- Use strict TypeScript configuration
- Use proper naming conventions:
  - camelCase/PascalCase for default selectors
  - PascalCase for types and enums
  - UPPER_CASE allowed for enum members
- No deprecated APIs (warn level)
- Handle floating promises properly
- Use string starts/ends with methods
- Prefer for-of loops over traditional for loops
- No useless constructors
- No shadow variables
</typescript_specific_rules>

<browser_compatibility>
- Support polyfills as defined in eslint config
- Test on multiple browsers and devices
- Use feature detection over browser detection
- Follow progressive enhancement principles
</browser_compatibility>

<translation_guidelines>
- Only commit changes to en-us.json in strings directory
- Use Weblate for other language translations
- Provide context for translatable strings
- Use proper string interpolation for dynamic content
</translation_guidelines>

<issue_workflow>
- Browse issues list to find work within your skill-set
- Comment on issues to state intent to work (avoid duplication)
- If no issue exists for your changes, create one first
- Reference issues in PRs with keywords (fixes #123, closes #456, addresses #789)
- Issues are triaged regularly by admin team with helpful labels
- Focus on labeled issues that match your expertise level
</issue_workflow>

<repository_setup>
- Follow "fork, feature-branch, and PR" model for contributions
- Fork repository to your GitHub account
- Clone your fork: git clone git@github.com:yourusername/jellyfin-web.git
- Add upstream remote: git remote add upstream git@github.com:jellyfin/jellyfin-web.git
- For first-time contributors: add yourself to CONTRIBUTORS.md file
- Add name to bottom of "Jellyfin Contributors" section
</repository_setup>

<branch_management>
- Always target master branch for PRs (except emergency hotfixes)
- Rebase against upstream/master before starting work
- Create feature branch: git checkout -b my-feature master
- Keep feature branches focused on single features/fixes
- Feature branches may be created for major multi-PR projects (coordinate with Core team)
- No PR should break master - test thoroughly before merging
</branch_management>

<testing_others_prs>
- Fetch PR changes: git fetch upstream pull/<PR_ID>/head:my-testing-branch
- Checkout test branch: git checkout my-testing-branch
- Perform required testing and builds
- Return to master and cleanup: git checkout master && git branch -D my-testing-branch
- Community reviews are welcome and encouraged
</testing_others_prs>