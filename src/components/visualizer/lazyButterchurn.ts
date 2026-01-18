// Lazy loader for butterchurn.logic to enable code splitting
let butterchurnModule: typeof import('components/visualizer/butterchurn.logic') | null = null;

export async function getButterchurnInstance() {
    if (!butterchurnModule) {
        butterchurnModule = await import('components/visualizer/butterchurn.logic');
    }
    return butterchurnModule.butterchurnInstance;
}
