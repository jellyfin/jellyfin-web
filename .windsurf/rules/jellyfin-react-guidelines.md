---
name: "jellyfin-react-guidelines"
activation: "Always On"
description: "Core React and TypeScript guidelines for Jellyfin Web development"
---

# Jellyfin Web React & TypeScript Guidelines

<project_context>
- This is Jellyfin Web - a React-based media server web interface
- Uses React 18, TypeScript, Material-UI, and Webpack
- Focus on performance, accessibility, and user experience
- Follows modern React patterns with functional components and hooks
</project_context>

<react_development_rules>
- Use React 18 functional components with hooks exclusively
- Prefer TypeScript over JavaScript for all new code
- Use Material-UI (@mui/material) components consistently
- Implement proper loading states and error boundaries
- Follow React performance best practices (useMemo, useCallback when needed)
- Use React.lazy() for code splitting large components
- Always handle async operations properly with proper error handling
</react_development_rules>

<typescript_standards>
- Use strict TypeScript configuration
- Define proper interfaces for all component props
- Avoid 'any' type - use 'unknown' or proper types instead
- Use generic types for API responses and reusable components
- Export types and interfaces for reuse across components
- Use proper union types for component variants
</typescript_standards>

<component_structure>
- Keep components small and focused (single responsibility)
- Use custom hooks for complex logic extraction
- Implement proper prop validation with TypeScript interfaces
- Use descriptive component and prop names
- Group related components in feature directories
</component_structure>