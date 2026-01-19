# AI Agent Error Monitoring Guide

This document describes how AI agents can monitor browser errors from the Jellyfin Web development server.

## Overview

When running `npm start`, the Vite dev server exposes error monitoring endpoints that AI agents can poll to detect issues in real-time without requiring access to the browser's DevTools.

## Endpoints

### 1. List Errors (Polling)

```bash
GET http://localhost:5173/__error-monitor/api/errors
```

Response format:
```json
{
  "count": 5,
  "errors": [
    {
      "id": 1,
      "message": "Cannot read property 'foo' of undefined",
      "stack": "Error.stack...",
      "timestamp": "2026-01-19T10:30:00.000Z",
      "type": "UNCAUGHT_ERROR"
    }
  ]
}
```

### 2. Get New Errors Since Timestamp

```bash
GET http://localhost:5173/__error-monitor/api/errors?since=1705655400000
```

Returns only errors newer than the specified Unix timestamp (milliseconds).

### 3. Clear Error Log

```bash
GET http://localhost:5173/__error-monitor/api/errors?action=clear
```

Clears all captured errors. Returns `{ "success": true }`.

### 4. Server-Sent Events (Real-Time Streaming)

```bash
GET http://localhost:5173/__error-monitor/event?since=<timestamp>
```

Streams errors as they occur in real-time. Each event:
```
event: error
data: {"id":1,"message":"...","timestamp":"...","type":"..."}
```

## Error Types

| Type | Description |
|------|-------------|
| `UNCAUGHT_ERROR` | Unhandled JavaScript exception |
| `UNHANDLED_REJECTION` | Unhandled Promise rejection |
| `CONSOLE_ERROR` | Console.error() calls |

## Example: Python Agent

```python
import requests
import time

class ErrorMonitor:
    def __init__(self, base_url="http://localhost:5173"):
        self.base_url = base_url
        self.last_timestamp = 0

    def get_errors(self):
        """Fetch new errors since last check."""
        url = f"{self.base_url}/__error-monitor/api/errors?since={self.last_timestamp}"
        response = requests.get(url)
        data = response.json()

        if data["errors"]:
            self.last_timestamp = max(
                self.last_timestamp,
                max(e["timestamp"] for e in data["errors"])
            )

        return data["errors"]

    def watch(self, callback, interval=0.5):
        """Continuously watch for new errors."""
        while True:
            errors = self.get_errors()
            for error in errors:
                callback(error)
            time.sleep(interval)

# Usage
monitor = ErrorMonitor()
monitor.watch(lambda e: print(f"ERROR: {e['type']} - {e['message']}"))
```

## Example: Bash Script

```bash
#!/bin/bash
LAST_TIMESTAMP=0

watch_errors() {
    curl -s "http://localhost:5173/__error-monitor/api/errors?since=$LAST_TIMESTAMP" | \
        jq -r '.errors[] | "\(.timestamp) [\(.type)] \(.message)"' 2>/dev/null
}

while true; do
    NEW_TS=$(curl -s "http://localhost:5173/__error-monitor/api/errors?since=$LAST_TIMESTAMP" | \
        jq -r 'if .errors | length > 0 then .errors[-1].timestamp else empty end')
    if [ -n "$NEW_TS" ]; then
        LAST_TIMESTAMP=$(date -d "$NEW_TS" +%s%3N)
        watch_errors
    fi
    sleep 0.5
done
```

## Example: Node.js Agent

```javascript
const http = require('http');

let lastTimestamp = 0;

function fetchErrors() {
    return new Promise((resolve) => {
        http.get('http://localhost:5173/__error-monitor/api/errors', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', () => resolve({ count: 0, errors: [] }));
    });
}

async function watch() {
    while (true) {
        const data = await fetchErrors();
        if (data.errors && data.errors.length > 0) {
            data.errors.forEach(err => {
                console.error(`[${err.timestamp}] ${err.type}: ${err.message}`);
            });
            lastTimestamp = Math.max(lastTimestamp,
                ...data.errors.map(e => new Date(e.timestamp).getTime()));
        }
        await new Promise(r => setTimeout(r, 500));
    }
}

watch();
```

## Integration with Agent Workflow

All errors captured by the monitor are also logged through the project's centralized logging system (`src/utils/logger.ts`), ensuring consistent formatting and context.

### Autonomous Error Detection

```javascript
import { getErrors } from 'utils/errorMonitor';

// Agent can check for errors before/after each action
async function agentActionWithErrorCheck(actionFn) {
    const beforeErrors = await getErrors();
    const beforeCount = beforeErrors.length;

    await actionFn();

    const afterErrors = await getErrors();
    if (afterErrors.length > beforeCount) {
        const newErrors = afterErrors.slice(beforeCount);
        throw new Error(`Action caused ${newErrors.length} error(s): ${newErrors.map(e => e.message).join('; ')}`);
    }
}
```

### Health Check Script

```bash
#!/bin/bash
# Check if browser is healthy by ensuring no new errors after load

curl -s "http://localhost:5173/__error-monitor/api/errors?action=clear" > /dev/null

echo "Waiting 5 seconds for initial load..."
sleep 5

ERRORS=$(curl -s "http://localhost:5173/__error-monitor/api/errors" | jq '.count')

if [ "$ERRORS" -gt 0 ]; then
    echo "❌ $ERRORS errors detected on initial load"
    curl -s "http://localhost:5173/__error-monitor/api/errors" | jq '.errors'
    exit 1
else
    echo "✅ No errors on initial load"
    exit 0
fi
```

## Best Practices

1. **Poll frequency**: Use 500ms interval for responsive detection without overloading the server
2. **Timestamp tracking**: Always update `lastTimestamp` to avoid duplicate processing
3. **Error clearing**: Clear errors before critical operations to isolate issues
4. **Stack traces**: Use the `stack` field for debugging specific error locations
5. **Rate limiting**: The server retains last 1000 errors in memory

## Troubleshooting

- **Connection refused**: Ensure `npm start` is running on port 5173
- **Empty responses**: Check that the dev server is in development mode (not production)
- **No errors appearing**: Errors must be uncaught or use `console.error()` to be captured
