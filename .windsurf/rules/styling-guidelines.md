---
name: "styling-guidelines"
activation: "Glob"
pattern: "*.{css,scss,styled.js,styled.ts}"
description: "Styling guidelines for Jellyfin Web interface"
---

# Styling Guidelines for Jellyfin Web

<css_methodology>
- Use CSS modules or styled-components for component styling
- Follow BEM naming convention for CSS classes when using plain CSS
- Use semantic class names that describe purpose, not appearance
- Avoid deep nesting in SCSS (maximum 3 levels)
- Use CSS custom properties (variables) for theming
</css_methodology>

<responsive_design>
- Implement mobile-first responsive design
- Use CSS Grid and Flexbox for layouts
- Test on multiple screen sizes and devices
- Ensure touch-friendly interface elements (minimum 44px touch targets)
- Use relative units (rem, em, %) over fixed pixels when appropriate
</responsive_design>

<material_ui_integration>
- Use Material-UI theme system consistently
- Extend MUI theme for custom colors and typography
- Use MUI's sx prop for component-specific styling
- Follow Material Design principles for spacing and elevation
- Use MUI breakpoints for responsive design
</material_ui_integration>

<accessibility_styling>
- Ensure sufficient color contrast (WCAG AA compliance)
- Provide focus indicators for keyboard navigation
- Use semantic HTML elements with appropriate styling
- Support high contrast mode and reduced motion preferences
- Test with screen readers and keyboard-only navigation
</accessibility_styling>

<performance_optimization>
- Minimize CSS bundle size
- Use efficient CSS selectors
- Avoid inline styles in favor of CSS classes
- Use CSS-in-JS efficiently (avoid creating styles in render)
- Optimize images and media assets
</performance_optimization>

<jellyfin_theming>
- Support both light and dark themes
- Use consistent spacing and typography scales
- Implement proper media player controls styling
- Style loading states and skeleton screens appropriately
- Ensure good contrast for media overlays and controls
</jellyfin_theming>