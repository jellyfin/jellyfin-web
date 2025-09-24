---
name: "media-handling-guidelines"
activation: "Model Decision"
description: "Apply when working with media playback, streaming, or media-related components"
---

# Media Handling Guidelines for Jellyfin Web

<media_playback>
- Always handle media loading states (loading, error, ready)
- Implement proper buffering and progress indicators
- Handle different media formats and codecs gracefully
- Provide fallback options for unsupported media
- Implement proper cleanup for media elements on component unmount
</media_playback>

<streaming_optimization>
- Use appropriate video quality based on connection speed
- Implement adaptive bitrate streaming when available
- Handle network interruptions and reconnection
- Optimize for different device capabilities
- Implement proper caching strategies for media metadata
</streaming_optimization>

<user_experience>
- Provide intuitive media controls (play, pause, seek, volume)
- Implement keyboard shortcuts for media control
- Show meaningful progress and time information
- Handle fullscreen mode properly across browsers
- Implement picture-in-picture support where available
</user_experience>

<performance_considerations>
- Lazy load media thumbnails and artwork
- Implement virtual scrolling for large media libraries
- Optimize image sizes and formats (WebP, AVIF when supported)
- Use proper caching headers for media assets
- Implement efficient search and filtering for media collections
</performance_considerations>

<error_handling>
- Provide clear error messages for media playback issues
- Handle codec compatibility issues gracefully
- Implement retry mechanisms for failed media loads
- Log media errors for debugging without exposing sensitive paths
- Provide alternative media sources when available
</error_handling>

<accessibility_media>
- Support subtitle and closed caption display
- Provide audio descriptions when available
- Implement proper ARIA labels for media controls
- Support keyboard navigation for all media functions
- Ensure media controls are usable with assistive technologies
</accessibility_media>