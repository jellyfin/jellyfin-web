---
name: "testing-standards"
activation: "Glob"
pattern: "*.{test,spec}.{js,ts,jsx,tsx}"
description: "Testing standards for Jellyfin Web components and utilities"
---

# Testing Standards for Jellyfin Web

<test_structure>
- Write descriptive test names that explain what is being tested
- Use describe blocks to group related tests logically
- Use beforeEach for common setup, afterEach for cleanup
- Test one thing at a time per test case
- Follow AAA pattern: Arrange, Act, Assert
</test_structure>

<react_testing>
- Use React Testing Library for component testing
- Test user interactions, not implementation details
- Use screen queries (getByRole, getByText) over container queries
- Test accessibility features (ARIA labels, keyboard navigation)
- Mock external dependencies and API calls
- Test both success and error scenarios for async operations
</react_testing>

<test_coverage>
- Aim for meaningful test coverage, not just high percentages
- Test critical user paths and edge cases
- Test error boundaries and error handling
- Test component props and state changes
- Test custom hooks separately from components
- Test utility functions thoroughly
</test_coverage>

<mocking_guidelines>
- Mock external API calls using MSW or similar tools
- Mock heavy dependencies that aren't part of the test focus
- Use jest.fn() for function mocking
- Mock media-related APIs (video, audio) appropriately
- Mock Jellyfin server responses consistently
</mocking_guidelines>

<jellyfin_specific_testing>
- Test media player functionality with mocked media elements
- Test server connection and authentication flows
- Test media library browsing and search functionality
- Test user settings and preferences handling
- Test responsive design for different screen sizes
- Test keyboard shortcuts and accessibility features
</jellyfin_specific_testing>