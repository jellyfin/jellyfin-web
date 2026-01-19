const POLL_INTERVAL = 500;
let lastTimestamp = 0;
let errorCount = 0;
let running = true;

async function fetchErrors() {
    const res = await fetch(`http://localhost:5173/__error-monitor/api/errors?since=${lastTimestamp}`);
    return res.json().catch(() => ({ count: 0, errors: [] }));
}

function formatError(error) {
    const time = new Date(error.timestamp).toLocaleTimeString();
    return `[${time}] [${error.type}] ${error.message}`;
}

async function poll() {
    if (!running) return;

    try {
        const data = await fetchErrors();

        if (data.count > errorCount) {
            const newErrors = data.errors.slice(errorCount - data.errors.length + data.count - errorCount);
            for (const error of newErrors) {
                console.warn('ERROR:', formatError(error));
            }
            errorCount = data.count;
        }

        if (data.errors.length > 0) {
            lastTimestamp = Math.max(lastTimestamp,
                ...data.errors.map(e => new Date(e.timestamp).getTime()));
        }
    } catch (e) {
        console.warn('Poll error:', e);
    }

    if (running) {
        setTimeout(poll, POLL_INTERVAL);
    }
}

function start() {
    console.warn('🔍 Error monitor started for http://localhost:5173');
    console.warn('Press Ctrl+C to stop\n');
    poll();
}

function stop() {
    running = false;
    console.warn('\n🛑 Error monitor stopped');
    process.exit(0);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start();
