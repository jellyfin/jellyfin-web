---
name: "security-guidelines"
activation: "Always On"
description: "Security guidelines specific to Jellyfin Web application"
---

# Security Guidelines for Jellyfin Web

<input_sanitization>
- Always sanitize user input using DOMPurify before rendering HTML
- Validate all form inputs on both client and server side
- Use proper escaping for dynamic content in JSX
- Never use dangerouslySetInnerHTML without DOMPurify sanitization
- Validate file uploads and media content properly
</input_sanitization>

<api_security>
- Validate all API responses before using the data
- Use HTTPS for all external API requests
- Implement proper authentication token handling
- Never expose sensitive data (API keys, tokens) in client-side code
- Use proper CORS configuration for API endpoints
- Implement rate limiting awareness in API calls
</api_security>

<dependency_security>
- Run npm audit regularly and fix high/critical vulnerabilities
- Keep dependencies updated, especially security patches
- Review new dependencies before adding to package.json
- Use npm ci in production builds for consistent installs
- Monitor for security advisories on used packages
</dependency_security>

<jellyfin_specific_security>
- Handle media file paths securely (no directory traversal)
- Validate media metadata before display
- Implement proper user session management
- Use secure storage for user preferences and settings
- Validate server URLs and connection parameters
- Handle authentication failures gracefully
</jellyfin_specific_security>

<development_security>
- Never commit sensitive data (tokens, passwords) to git
- Use environment variables for configuration
- Avoid console.log statements with sensitive data
- Use proper error handling that doesn't expose system details
- Implement proper logging without sensitive information
</development_security>