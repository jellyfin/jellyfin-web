---
name: "jellyfin-architecture-standards"
activation: "Always On"
description: "Architecture and code organization standards specific to Jellyfin Web project"
---

# Jellyfin Web Architecture Standards

<app_structure_bulletproof_react>
- Follow Bulletproof React architecture guidelines
- Organize code under appropriate app directories:
  - src/apps/dashboard - Admin dashboard functionality
  - src/apps/experimental - New experimental features
  - src/apps/stable - Classic/stable app features
  - src/apps/wizard - Setup and configuration wizard
- Use feature-based organization within apps
- Keep shared/common code in appropriate shared directories
</app_structure_bulletproof_react>

<shared_directories>
- src/components - Higher order visual components and React components
- src/hooks - Custom React hooks for reusable logic
- src/utils - Pure utility functions
- src/types - Common TypeScript interfaces and types
- src/constants - Application constants and configuration
- src/lib - Reusable libraries and external integrations
- src/themes - Sass and MUI theme configurations
- src/assets - Static assets (images, fonts, etc.)
</shared_directories>

<legacy_code_handling>
- Avoid creating new files in deprecated directories:
  - src/controllers ❌ (Legacy page views)
  - src/scripts ❌ (Mixed utilities - serious mess)
- When working with existing legacy code:
  - Refactor to new structure when possible
  - Don't extend legacy patterns
  - Migrate to React components and hooks
  - Move utilities to proper src/utils location
</legacy_code_handling>

<component_organization>
- Create feature-specific component directories
- Use index.ts files for clean exports
- Group related components together
- Separate presentational from container components
- Use proper component naming (PascalCase)
- Keep components focused and single-purpose
</component_organization>

<api_integration>
- Use @jellyfin/sdk for API calls
- Import specific API functions for tree-shaking
- Handle API errors consistently
- Use proper TypeScript types for API responses
- Implement loading and error states
- Cache API responses appropriately
</api_integration>

<state_management>
- Use React hooks for local component state
- Use Context API for shared state when needed
- Avoid prop drilling - use composition patterns
- Keep state as close to where it's used as possible
- Use custom hooks for complex state logic
- Consider React Query for server state management
</state_management>

<routing_navigation>
- Use React Router for client-side routing
- Implement proper route guards for authentication
- Use lazy loading for route-based code splitting
- Handle navigation state properly
- Implement breadcrumbs and navigation helpers
- Support deep linking and browser history
</routing_navigation>

<media_handling_architecture>
- Separate media player logic from UI components
- Use proper event handling for media events
- Implement consistent media controls across players
- Handle different media formats and codecs
- Support subtitle and audio track switching
- Implement proper cleanup for media resources
</media_handling_architecture>

<performance_considerations>
- Implement code splitting at route and component level
- Use React.lazy() for dynamic imports
- Optimize bundle size with proper tree-shaking
- Implement virtual scrolling for large lists
- Use proper image optimization and lazy loading
- Monitor and optimize Core Web Vitals
</performance_considerations>

<testing_architecture>
- Write tests for critical user paths
- Test components in isolation
- Mock external dependencies properly
- Test error scenarios and edge cases
- Use React Testing Library best practices
- Maintain good test coverage for new code
</testing_architecture>

<build_deployment>
- Use Webpack for bundling and optimization
- Support multiple build environments (dev, prod)
- Implement proper source maps for debugging
- Use proper asset optimization
- Support hot module replacement in development
- Ensure builds are reproducible and consistent
</build_deployment>