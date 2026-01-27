#!/usr/bin/env node

/**
 * Architectural Validation Script
 * Enforces custom architectural patterns that Biome cannot enforce directly.
 *
 * Rules:
 * 1. No class components (only functional components)
 * 2. No barrel imports from architectural layers
 * 3. Arrow function components preferred (warning only)
 */

const { globSync } = require('fast-glob');
const fs = require('fs');

const errors = [];
const warnings = [];

// Patterns for barrel imports to avoid
const barrelImportPatterns = [
    /from\s+['"]\.\.\/components['"]/,
    /from\s+['"]\.\/components['"]/,
    /from\s+['"]components['"]/,
    /from\s+['"]\.\.\/apps['"]/,
    /from\s+['"]\.\/apps['"]/,
    /from\s+['"]apps['"]/,
    /from\s+['"]\.\.\/store['"]/,
    /from\s+['"]\.\/store['"]/,
    /from\s+['"]store['"]/,
    /from\s+['"]\.\.\/hooks['"]/,
    /from\s+['"]\.\/hooks['"]/,
    /from\s+['"]hooks['"]/,
    /from\s+['"]\.\.\/ui-primitives['"]/,
    /from\s+['"]\.\/ui-primitives['"]/,
    /from\s+['"]ui-primitives['"]/,
    /from\s+['"]\.\.\/utils['"]/,
    /from\s+['"]\.\/utils['"]/,
    /from\s+['"]utils['"]/
];

// Files to check
const tsxFiles = globSync('src/**/*.{tsx,ts,jsx,js}', {
    ignore: ['**/node_modules/**', '**/*.stories.tsx', '**/*.test.tsx', '**/*.d.ts']
});

let fileCount = 0;

tsxFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');

    // Check for class components (but allow error boundaries)
    const classComponentMatch = content.match(/class\s+(\w+)\s+extends\s+(React\.)?Component/);
    if (classComponentMatch) {
        // Allow error boundaries (they must be class components)
        const isErrorBoundary = /getDerivedStateFromError|componentDidCatch/.test(content);
        if (!isErrorBoundary) {
            errors.push(
                `${file}: Class component detected (${classComponentMatch[1]}). Use functional components instead.`
            );
        }
    }

    // Check for barrel imports (warnings, not errors - migration in progress)
    barrelImportPatterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
            warnings.push(
                `${file}: Barrel import detected. Import specific items instead: ${matches[0]}`
            );
        }
    });

    // Check for named function components (warning only)
    const namedFunctionMatch = content.match(/^export\s+function\s+(\w+)\s*\([^)]*\)\s*[:{]/m);
    if (namedFunctionMatch && file.endsWith('.tsx')) {
        warnings.push(
            `${file}: Named function component (${namedFunctionMatch[1]}). Consider using arrow functions instead.`
        );
    }

    fileCount++;
});

console.log(`✓ Checked ${fileCount} files for architectural violations\n`);

if (errors.length > 0) {
    console.error('❌ Architectural Violations Found:\n');
    errors.forEach((error) => {
        console.error(`  • ${error}`);
    });
    console.error('');
}

if (warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    warnings.forEach((warning) => {
        console.warn(`  • ${warning}`);
    });
    console.warn('');
}

if (errors.length > 0) {
    process.exit(1);
}

process.exit(0);
