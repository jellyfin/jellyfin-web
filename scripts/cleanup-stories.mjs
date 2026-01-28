import fs from 'fs';
import glob from 'fast-glob';

const MAPPINGS = [
    { from: /\s*itemId="[^"]*"/g, to: "" },
    { from: /\s*isCurrentTrack={[^}]*}/g, to: "" },
    { from: /\s*isNextTrack={[^}]*}/g, to: "" },
    { from: /\s*item: true,/g, to: "" },
    { from: /\s*item={true}/g, to: "" },
    { from: /\s*item={false}/g, to: "" },
    { from: /vars\.colors\.primaryText/g, to: "vars.colors.text" },
];

const files = glob.sync('src/**/__stories__/**/*.{ts,tsx}');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    MAPPINGS.forEach(mapping => {
        if (mapping.from.test(content)) {
            content = content.replace(mapping.from, mapping.to);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Cleaned: ${file}`);
    }
});
