const [, , scriptName] = process.argv;
const label = scriptName ? ` (${scriptName})` : '';

console.error(`Watch mode is disabled${label}. Use the non-watch command instead.`);
process.exit(1);
