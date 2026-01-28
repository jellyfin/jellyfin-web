import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

const MAPPINGS = [
    // Hardcoded values
    { from: /padding:\s*'48px'/g, to: "padding: vars.spacing['6']" },
    { from: /padding:\s*'24px'/g, to: "padding: vars.spacing['5']" },
    { from: /marginBottom:\s*'32px'/g, to: "marginBottom: vars.spacing['6']" },
    { from: /marginBottom:\s*'24px'/g, to: "marginBottom: vars.spacing['5']" },
    { from: /marginBottom:\s*'16px'/g, to: "marginBottom: vars.spacing['4']" },
    { from: /marginBottom:\s*'8px'/g, to: "marginBottom: vars.spacing['2']" },
    { from: /marginTop:\s*'16px'/g, to: "marginTop: vars.spacing['4']" },
    { from: /marginTop:\s*'8px'/g, to: "marginTop: vars.spacing['2']" },
    { from: /marginTop:\s*'4px'/g, to: "marginTop: vars.spacing['1']" },
    { from: /fontSize:\s*'14px'/g, to: "fontSize: vars.typography['2'].fontSize" },
    { from: /fontSize:\s*'12px'/g, to: "fontSize: vars.typography['1'].fontSize" },
    { from: /gap:\s*'16px'/g, to: "gap: vars.spacing['4']" },
    { from: /gap:\s*'12px'/g, to: "gap: vars.spacing['3']" },
    { from: /gap:\s*'8px'/g, to: "gap: vars.spacing['2']" },
    { from: /gap:\s*'4px'/g, to: "gap: vars.spacing['1']" },
    
    // Semantic to Numeric
    { from: /vars.spacing.xs/g, to: "vars.spacing['2']" },
    { from: /vars.spacing.sm/g, to: "vars.spacing['4']" },
    { from: /vars.spacing.md/g, to: "vars.spacing['5']" },
    { from: /vars.spacing.lg/g, to: "vars.spacing['6']" },
    { from: /vars.spacing.xl/g, to: "vars.spacing['7']" },
    { from: /vars.spacing.xxl/g, to: "vars.spacing['8']" },
    { from: /vars.spacing.xxxl/g, to: "vars.spacing['9']" },
    
    // Typography
    { from: /vars.typography.fontSizeXs/g, to: "vars.typography['1'].fontSize" },
    { from: /vars.typography.fontSizeSm/g, to: "vars.typography['3'].fontSize" },
    { from: /vars.typography.fontSizeMd/g, to: "vars.typography['6'].fontSize" },
    { from: /vars.typography.fontSizeLg/g, to: "vars.typography['7'].fontSize" },
    { from: /vars.typography.fontSizeXl/g, to: "vars.typography['8'].fontSize" },
    { from: /vars.typography.fontSizeXxl/g, to: "vars.typography['9'].fontSize" },

    // Storybook fixes
    { from: /@storybook\/react-vite-vite/g, to: "@storybook/react" },
];

const files = glob.sync('src/**/*.{ts,tsx}');

files.forEach(file => {
    if (file.endsWith('tokens.css.ts')) return;

    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix storybook specific imports if they are broken
    if (file.includes('__stories__')) {
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (line.includes("from '../styles/tokens.css")) {
                lines[i] = line.replace(/from '\.\.\/styles\/tokens\.css(\.ts)?'/g, "from '../../../styles/tokens.css'");
                changed = true;
            }
            // Fix relative component imports
            if (line.includes("from '../") && !line.includes("from '../../")) {
                lines[i] = line.replace(/from '\.\.\//g, "from '../../");
                changed = true;
            }
            
            // Fix (Story) parameter any
            if (line.includes('(Story) =>') || line.includes('(_Story) =>')) {
                lines[i] = line.replace(/\((_?Story)\)/g, "($1: any)");
                changed = true;
            }
        });
        if (changed) content = lines.join('\n');
    }

    MAPPINGS.forEach(mapping => {
        if (mapping.from.test(content)) {
            content = content.replace(mapping.from, mapping.to);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Migrated: ${file}`);
    }
});