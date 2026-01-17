# Jellyfin Web Bundle Optimization Plan

## Phase 1: Analysis (Safe)
```bash
# Analyze current bundle
npm run build:production
npx webpack-bundle-analyzer dist/static/*.js

# Identify large dependencies
npm ls --all | grep -E "(jquery|lodash|material)" | head -10
```

## Phase 2: Safe Removals
```bash
# Remove unused jQuery if confirmed unused
npm uninstall jquery

# Optimize font loading - keep only essential fonts
# Edit package.json to remove unused @fontsource packages
```

## Phase 3: Code Splitting Implementation
```javascript
// Add to webpack.common.js optimization.splitChunks
splitChunks: {
  cacheGroups: {
    // Separate vendor chunks
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      chunks: 'all'
    },
    // Separate large libraries
    butterchurn: {
      test: /[\\/]node_modules[\\/]butterchurn/,
      name: 'butterchurn',
      chunks: 'all'
    }
  }
}
```

## Phase 4: Lazy Loading
```typescript
// Lazy load heavy components
const AudioVisualizer = lazy(() => import('./components/AudioVisualizer'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));
```

## Phase 5: Asset Optimization
```javascript
// Add image optimization
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

// Compress and optimize images
new ImageMinimizerPlugin({
  minimizer: {
    implementation: ImageMinimizerPlugin.sharpMinify,
    options: { /* options */ }
  }
})
```