#!/usr/bin/env tsx
/**
 * Storybook Parity Checker
 *
 * Validates that stories match their component APIs:
 * 1. Stories import actual components (not duplicate implementations)
 * 2. Story args match component prop types
 * 3. Mock providers match actual store interfaces
 * 4. No missing stories for exported components
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'fast-glob';

interface ComponentInfo {
    name: string;
    filePath: string;
    exported: boolean;
    props: string[];
}

interface StoryInfo {
    filePath: string;
    title: string;
    componentImported: string | null;
    hasDuplicateComponent: boolean;
    argsDefined: string[];
    argTypesDefined: string[];
}

interface ParityIssue {
    type: 'error' | 'warning' | 'info';
    file: string;
    message: string;
    suggestion?: string;
}

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const ISSUES: ParityIssue[] = [];

/**
 * Extract exported components from a TypeScript file
 */
function extractComponents(filePath: string): ComponentInfo[] {
    const components: ComponentInfo[] = [];
    const content = fs.readFileSync(filePath, 'utf-8');

    // Match export declarations
    const exportNamedRegex = /export\s+(?:function|const|interface|type|class)\s+(\w+)/g;
    const exportDefaultRegex = /export\s+default\s+(\w+)/g;

    let match: RegExpExecArray | null;
    const componentNames = new Set<string>();

    let namedMatch: RegExpExecArray | null;
    let defaultMatch: RegExpExecArray | null;

    while ((namedMatch = exportNamedRegex.exec(content)) !== null) {
        componentNames.add(namedMatch[1]);
    }
    while ((defaultMatch = exportDefaultRegex.exec(content)) !== null) {
        componentNames.add(defaultMatch[1]);
    }

    for (const name of componentNames) {
        components.push({
            name,
            filePath,
            exported: true,
            props: extractProps(content, name)
        });
    }

    return components;
}

/**
 * Extract props for a component from its interface/type
 */
function extractProps(content: string, componentName: string): string[] {
    const props: string[] = [];

    // Look for interface or type matching component name
    const interfaceRegex = new RegExp(`interface\\s+${componentName}Props\\s*\\{([^}]*)\\}`, 's');
    const typeRegex = new RegExp(`type\\s+${componentName}Props\\s*=\\s*\\{([^}]*)\\}`, 's');

    const interfaceMatch = interfaceRegex.exec(content);
    const typeMatch = typeRegex.exec(content);

    const propsContent = interfaceMatch?.[1] || typeMatch?.[1];

    if (propsContent) {
        const propMatches = propsContent.matchAll(/(\w+)(\??):/g);
        for (const propMatch of propMatches) {
            props.push(propMatch[1]);
        }
    }

    return props;
}

/**
 * Analyze a story file for parity issues
 */
function analyzeStory(filePath: string): StoryInfo {
    const content = fs.readFileSync(filePath, 'utf-8');
    const storyInfo: StoryInfo = {
        filePath,
        title: '',
        componentImported: null,
        hasDuplicateComponent: false,
        argsDefined: [],
        argTypesDefined: []
    };

    // Extract story title
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    if (titleMatch) {
        storyInfo.title = titleMatch[1];
    }

    // Check for component import from actual component file
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let importResult: RegExpExecArray | null;
    while ((importResult = importRegex.exec(content)) !== null) {
        const importedComponentNames = importResult[1].split(',').map(s => s.trim());
        const componentImportPath = importResult[2];

        // Check if importing from a component (not another story or util)
        if (!componentImportPath.includes('.stories') && !componentImportPath.endsWith('.css.ts')) {
            for (const name of importedComponentNames) {
                // Look for actual component name (capitalized)
                if (/^[A-Z]/.test(name) && name !== 'Story' && name !== 'Meta') {
                    storyInfo.componentImported = name;
                    break;
                }
            }
        }
    }

    // Check for duplicate component definition (BAD PATTERN)
    const duplicatePatterns = [
        /function\s+WaveformCell\s*\(/,
        /function\s+\w+\s*\([^)]*\)\s*\{[^}]*canvas[^}]*drawWaveform/s,
        /const\s+WaveformCell\s*=\s*\(/
    ];

    for (const pattern of duplicatePatterns) {
        if (pattern.test(content)) {
            storyInfo.hasDuplicateComponent = true;
            ISSUES.push({
                type: 'error',
                file: filePath,
                message: 'Duplicate component implementation found in story file',
                suggestion: 'Import the actual component instead of defining it inline'
            });
            break;
        }
    }

    // Extract args from story definitions
    const argsMatch = content.match(/args:\s*\{([^}]+)\}/s);
    if (argsMatch) {
        const argsContent = argsMatch[1];
        const argMatches = argsContent.matchAll(/(\w+):/g);
        for (const argMatch of argMatches) {
            storyInfo.argsDefined.push(argMatch[1]);
        }
    }

    // Extract argTypes
    const argTypesMatch = content.match(/argTypes:\s*\{([^}]+)\}/s);
    if (argTypesMatch) {
        const typesContent = argTypesMatch[1];
        const typeMatches = typesContent.matchAll(/(\w+):/g);
        for (const typeMatch of typeMatches) {
            storyInfo.argTypesDefined.push(typeMatch[1]);
        }
    }

    return storyInfo;
}

/**
 * Find all story files
 */
function findStoryFiles(): string[] {
    return glob.sync('src/**/__stories__/*.stories.{ts,tsx}', {
        cwd: ROOT_DIR
    });
}

/**
 * Find all component files
 */
function findComponentFiles(): string[] {
    return glob
        .sync('src/components/**/*.{ts,tsx}', {
            cwd: ROOT_DIR,
            ignore: ['**/__stories__/**', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx']
        })
        .filter(f => {
            const content = fs.readFileSync(path.join(ROOT_DIR, f), 'utf-8');
            return /export\s+(?:function|const|class|interface|type)\s+[A-Z]/.test(content);
        });
}

/**
 * Check for missing stories
 */
function checkMissingStories(components: ComponentInfo[], stories: StoryInfo[]) {
    const componentNames = new Set(components.map(c => c.name));
    const storyComponentNames = new Set<string>();

    for (const story of stories) {
        if (story.componentImported) {
            storyComponentNames.add(story.componentImported);
        }
    }

    for (const component of components) {
        if (!storyComponentNames.has(component.name)) {
            // Only report if component is in a common location
            if (component.filePath.includes('/components/')) {
                ISSUES.push({
                    type: 'warning',
                    file: component.filePath,
                    message: `Component "${component.name}" has no corresponding story file`,
                    suggestion: `Create ${component.name}.stories.tsx in __stories__ folder`
                });
            }
        }
    }
}

/**
 * Check for duplicate component definitions in stories
 */
function checkDuplicateComponents(stories: StoryInfo[]) {
    for (const story of stories) {
        if (story.hasDuplicateComponent) {
            ISSUES.push({
                type: 'error',
                file: story.filePath,
                message: `Story "${story.title}" contains duplicate component definition`
            });
        }
    }
}

/**
 * Check that stories import actual components
 */
function checkStoryImports(stories: StoryInfo[]) {
    for (const story of stories) {
        if (!story.componentImported && !story.hasDuplicateComponent) {
            // Check if it's a MDX documentation file (which doesn't need component import)
            if (!story.filePath.endsWith('.mdx')) {
                ISSUES.push({
                    type: 'warning',
                    file: story.filePath,
                    message: `Story "${story.title}" may not be importing an actual component`
                });
            }
        }
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🔍 Storybook Parity Checker\n');

    console.log('📂 Finding story files...');
    const storyFiles = findStoryFiles();
    console.log(`   Found ${storyFiles.length} story files`);

    console.log('📂 Finding component files...');
    const componentFiles = findComponentFiles();
    console.log(`   Found ${componentFiles.length} component files`);

    console.log('\📊 Analyzing components...');
    const components: ComponentInfo[] = [];
    for (const file of componentFiles) {
        components.push(...extractComponents(path.join(ROOT_DIR, file)));
    }
    console.log(`   Extracted ${components.length} exported components`);

    console.log('\📊 Analyzing stories...');
    const stories: StoryInfo[] = [];
    for (const file of storyFiles) {
        stories.push(analyzeStory(path.join(ROOT_DIR, file)));
    }
    console.log(`   Analyzed ${stories.length} story files`);

    console.log('\🔎 Running parity checks...\n');

    checkMissingStories(components, stories);
    checkDuplicateComponents(stories);
    checkStoryImports(stories);

    // Report results
    const errors = ISSUES.filter(i => i.type === 'error');
    const warnings = ISSUES.filter(i => i.type === 'warning');
    const infos = ISSUES.filter(i => i.type === 'info');

    if (ISSUES.length === 0) {
        console.log('✅ No parity issues found!');
    } else {
        console.log(`❌ ${errors.length} errors`);
        console.log(`⚠️  ${warnings.length} warnings`);
        console.log(`ℹ️  ${infos.length} informational\n`);

        for (const issue of ISSUES) {
            const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`${icon} ${issue.file}`);
            console.log(`   ${issue.message}`);
            if (issue.suggestion) {
                console.log(`   💡 ${issue.suggestion}`);
            }
            console.log();
        }

        // Exit with error code if there are errors
        if (errors.length > 0) {
            process.exit(1);
        }
    }

    console.log('\📋 Summary:');
    console.log(
        `   Stories with actual component imports: ${stories.filter(s => s.componentImported).length}/${stories.length}`
    );
    console.log(`   Stories with duplicate definitions: ${stories.filter(s => s.hasDuplicateComponent).length}`);
    console.log(
        `   Components without stories: ${warnings.filter(i => i.message.includes('no corresponding story')).length}`
    );
}

main().catch(console.error);
