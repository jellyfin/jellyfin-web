---
name: "js-ts-coding-standards"
activation: "Glob"
pattern: "*.{js,ts,jsx,tsx}"
description: "JavaScript and TypeScript coding standards for Jellyfin Web"
---

# JavaScript/TypeScript Coding Standards

<coding_standards>
- Use const/let instead of var (const preferred when possible)
- Prefer arrow functions for callbacks and short functions
- Use async/await over Promise.then() chains
- Always handle errors in async functions with try/catch
- Use meaningful, descriptive variable and function names
- Follow camelCase for variables and functions, PascalCase for components
- Use template literals instead of string concatenation
</coding_standards>

<imports_exports>
- Use named imports when possible over default imports
- Group imports in this order:
  1. External libraries (react, @mui/material, etc.)
  2. Internal utilities and hooks
  3. Component imports
  4. Type-only imports (import type)
- Use absolute imports for src/ directory paths
- Avoid deep relative imports (../../..)
</imports_exports>

<error_handling>
- Always handle API call errors gracefully
- Use proper error boundaries for React components
- Log errors appropriately (avoid console.log in production)
- Provide user-friendly error messages
- Implement retry mechanisms for network requests
</error_handling>

<performance_considerations>
- Avoid creating objects/functions in render methods
- Use useMemo for expensive calculations
- Use useCallback for functions passed to child components
- Implement proper cleanup in useEffect hooks
- Avoid unnecessary re-renders with React.memo when appropriate
</performance_considerations>