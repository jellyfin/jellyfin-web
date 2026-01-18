# Build Caching Implementation

## Overview

Jellyfin Web now includes enhanced build caching to significantly improve development and build performance.

## Features Implemented

### 1. Webpack Filesystem Caching
- **Type**: `filesystem` (persistent across builds)
- **Versioning**: Includes commit SHA and environment for cache invalidation
- **Dependencies**: Tracks config and package.json changes
- **Naming**: Environment-specific cache directories

### 2. Development Server Optimizations
- **Watch Options**: Optimized file watching with ignored patterns
- **Dev Middleware**: Improved in-memory caching (24hr max age)
- **Hot Module Replacement**: Enabled with React Fast Refresh

### 3. Cache Management
- **Clear Command**: `npm run cache:clear`
- **Automatic Invalidation**: On config/package.json changes
- **Environment Separation**: Different caches for dev/prod

## Performance Impact

### Expected Improvements
- **Incremental Builds**: 60-80% faster rebuilds
- **Development Server**: Faster file watching and HMR
- **Memory Usage**: Better caching reduces memory pressure
- **CI/CD**: Cached builds for faster pipelines

### Cache Locations
- **Webpack Cache**: `.webpack-cache-[env]/` (auto-created)
- **Node Modules Cache**: `node_modules/.cache/` (npm/yarn)
- **Development Assets**: In-memory during dev server

## Usage

### Development
```bash
# Start dev server (caching enabled automatically)
npm run serve

# Clear caches if issues occur
npm run cache:clear
```

### Production Builds
```bash
# Build with caching (automatic)
npm run build:production
```

### CI/CD Integration
```yaml
# Add to your CI pipeline
- name: Clear old caches
  run: npm run cache:clear

- name: Install dependencies
  run: npm ci

- name: Build
  run: npm run build:production
```

## Configuration Details

### Webpack Cache Settings
```javascript
cache: {
  type: 'filesystem',
  version: `${COMMIT_SHA}-${NODE_ENV}`,
  buildDependencies: {
    config: [__filename],
    package: ['package.json']
  },
  name: `${NODE_ENV}-cache`
}
```

### Development Watch Options
```javascript
watchOptions: {
  ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
  aggregateTimeout: 300,
  poll: false  // Use native file watching
}
```

## Troubleshooting

### Cache Issues
If you encounter build issues:
1. Clear caches: `npm run cache:clear`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Check webpack version compatibility

### Performance Monitoring
Monitor cache effectiveness:
```bash
# Check cache directory sizes
du -sh .webpack-cache* node_modules/.cache 2>/dev/null || echo "No cache directories"

# Time builds with/without cache
time npm run build:production
```

## Best Practices

1. **Commit SHA Versioning**: Ensures cache invalidation on code changes
2. **Environment Separation**: Prevents dev/prod cache conflicts
3. **Dependency Tracking**: Automatic invalidation on config changes
4. **Memory Limits**: Prevents excessive memory usage in CI

## Migration Notes

- **Breaking Changes**: None - fully backward compatible
- **Existing Projects**: Cache will be created on first build
- **Team Impact**: Faster builds for all developers
- **CI Impact**: Potentially faster CI pipelines

## Future Enhancements

- **Parallel Caching**: Multiple cache instances for monorepos
- **Remote Caching**: Cloud-based cache sharing
- **Cache Compression**: Reduced storage requirements
- **Cache Analytics**: Usage and hit rate monitoring