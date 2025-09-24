---
name: "git-workflow-guidelines"
activation: "Model Decision"
description: "Apply when working with Git operations, commits, branches, or pull requests"
---

# Git Workflow Guidelines for Jellyfin Web

<branch_management>
- Use "fork, feature-branch, and PR" model for contributions
- Create feature branches from master: git checkout -b my-feature master
- Use descriptive branch names that explain the feature/fix
- Keep branches focused on single features or bug fixes
- Rebase against upstream master before submitting PR
- Delete feature branches after successful merge
</branch_management>

<commit_practices>
- Follow "How to Write a Git Commit Message" guidelines
- Use imperative mood: "Fix bug" not "Fixed bug" or "Fixes bug"
- Keep subject line under 50 characters
- Capitalize subject line, no ending punctuation
- Separate subject from body with blank line
- Wrap body at 72 characters
- Explain what and why, not how
- Reference issues: "Fixes #123", "Closes #456", "Addresses #789"
</commit_practices>

<commit_squashing>
- Squash "junk" commits before PR submission:
  - ❌ "fixed typo", "whoops", "debugging", "wip"
  - ✅ Meaningful commits that represent logical changes
- One commit per significant change for large PRs
- Don't squash everything into one commit for multi-file changes
- Keep commit history clean and meaningful
</commit_squashing>

<pr_workflow>
- Fork jellyfin-web to your GitHub account
- Clone your fork: git clone git@github.com:yourusername/jellyfin-web.git
- Add upstream remote: git remote add upstream git@github.com:jellyfin/jellyfin-web.git
- Create feature branch: git checkout -b feature-name master
- Make changes and commit with good messages
- Push to your fork: git push --set-upstream origin feature-name
- Create PR against upstream master branch
- Respond to review feedback promptly
- Avoid force-pushing after reviews start
</pr_workflow>

<pr_requirements>
- Title: Short, descriptive, imperative mood
- Description must include:
  - Why changes are being made
  - How you approached the problem
  - Reference to related issues
- Mark as draft if not ready for review
- Ensure CI passes before requesting review
- At least one admin team member approval required
- Two team member approvals required for master branch
</pr_requirements>

<branch_maintenance>
- Keep feature branches up to date:
  - git fetch --all
  - git rebase upstream/master
- After PR merge, update local master:
  - git checkout master
  - git rebase upstream/master
  - git push -u origin master
- Clean up merged branches:
  - git branch -d feature-name
</branch_maintenance>

<collaboration_guidelines>
- Communicate in PR comments for technical discussions
- Use GitHub issues for bug reports and feature requests
- Tag relevant team members for specific expertise
- Be respectful and constructive in code reviews
- Test changes thoroughly before submitting PR
- Document breaking changes clearly
</collaboration_guidelines>