#!/bin/bash
# Jellyfin Web Maintenance Automation Setup

echo "🔧 Setting up automated maintenance..."

# Install maintenance tools
npm install --save-dev husky lint-staged npm-check-updates

# Setup pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run test"

# Setup lint-staged for faster commits
echo '{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "stylelint --fix"
  ],
  "*.{css,scss}": [
    "stylelint --fix"
  ]
}' >.lintstagedrc

# Setup automated dependency updates
npm install --save-dev renovate
echo '{
  "extends": [
    "config:base",
    "schedule:weekly",
    ":maintainLockFilesWeekly"
  ],
  "packageRules": [
    {
      "matchPackagePatterns": ["@jellyfin/*"],
      "schedule": ["before 4am on Monday"]
    },
    {
      "matchUpdateTypes": ["major"],
      "schedule": ["before 4am on first day of month"]
    }
  ]
}' >renovate.json

echo "✅ Maintenance automation configured"
