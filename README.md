<h1 align="center">Fork Jellyfin Web</h1>

在使用 jellyfin 的时候,在 web 上,我感觉缺失一个很常用的功能:精准空降

因此我 fork 了一个 jellyfin-web 自己实现了一个可以用的效果

使用方式:

在视频播放界面,右下角,会比普通播放器多一个分享按钮,点击之后,会复制一个链接到剪切板
---


## Build Process

### Dependencies

- [Node.js](https://nodejs.org/en/download)
- npm (included in Node.js)

### Getting Started

1. Clone or download this repository.

   ```sh
   git clone https://github.com/GRCmade/fork-jellyfin-web.git
   cd jellyfin-web
   ```

2. Install build dependencies in the project directory.

   ```sh
   npm install
   ```

3. Run the web client with webpack for local development.

   ```sh
   npm start
   ```

4. Build the client with sourcemaps available.

   ```sh
   npm run build:development
   ```

## Directory Structure

> [!NOTE]
> We are in the process of refactoring to a [new structure](https://forum.jellyfin.org/t-proposed-update-to-the-structure-of-jellyfin-web) based on [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) architecture guidelines.
> Most new code should be organized under the appropriate app directory unless it is common/shared.

```
.
└── src
    ├── apps
    │   ├── dashboard           # Admin dashboard app
    │   ├── experimental        # New experimental app
    │   ├── stable              # Classic (stable) app
    │   └── wizard              # Startup wizard app
    ├── assets                  # Static assets
    ├── components              # Higher order visual components and React components
    ├── constants               # Common constant values
    ├── controllers             # Legacy page views and controllers 🧹 ❌
    ├── elements                # Basic webcomponents and React equivalents 🧹
    ├── hooks                   # Custom React hooks
    ├── lib                     # Reusable libraries
    │   ├── globalize           # Custom localization library
    │   ├── jellyfin-apiclient  # Supporting code for the deprecated apiclient package
    │   ├── legacy              # Polyfills for legacy browsers
    │   ├── navdrawer           # Navigation drawer library for classic layout
    │   └── scroller            # Content scrolling library
    ├── plugins                 # Client plugins (features dynamically loaded at runtime)
    ├── scripts                 # Random assortment of visual components and utilities 🐉 ❌
    ├── strings                 # Translation files (only commit changes to en-us.json)
    ├── styles                  # Common app Sass stylesheets
    ├── themes                  # Sass and MUI themes
    ├── types                   # Common TypeScript interfaces/types
    └── utils                   # Utility functions
```

- ❌ &mdash; Deprecated, do **not** create new files here
- 🧹 &mdash; Needs cleanup
- 🐉 &mdash; Serious mess (Here be dragons)
