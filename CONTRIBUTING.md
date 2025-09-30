# Contributing to Jellyfin Web

Thank you for your interest in contributing to Jellyfin Web! This guide will help you get started with development and contributing to the project.

## 🚀 Quick Start for New Developers

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/download) (version 18 or higher recommended)
- npm (included with Node.js)
- [Git](https://git-scm.com/downloads)
- A code editor (we recommend [Visual Studio Code](https://code.visualstudio.com/))

### Setting Up Your Development Environment

1. **Fork the Repository**
   - Go to https://github.com/jellyfin/jellyfin-web
   - Click the "Fork" button in the top right corner
   - This creates your own copy of the repository

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/jellyfin-web.git
   cd jellyfin-web
   ```

3. **Add the Original Repository as Upstream**
   ```bash
   git remote add upstream https://github.com/jellyfin/jellyfin-web.git
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start the Development Server**
   ```bash
   npm start
   ```
   
   This will start the development server at `http://localhost:8080`

### Connecting to a Jellyfin Server

To develop effectively, you'll need a Jellyfin server to connect to:

1. **Option 1: Use the Demo Server**
   - The development server will automatically connect to the demo server
   - This is the easiest option for getting started

2. **Option 2: Local Jellyfin Server**
   - Install [Jellyfin Server](https://jellyfin.org/downloads/)
   - Run the server locally (usually at `http://localhost:8096`)
   - The web client will automatically detect and connect to it

3. **Option 3: Remote Server**
   - You can connect to any accessible Jellyfin server
   - Enter the server URL when prompted

## 📁 Project Structure

Understanding the project structure will help you navigate the codebase:

```
src/
├── apps/                   # Main applications
│   ├── dashboard/         # Admin dashboard
│   ├── experimental/      # New experimental features
│   ├── stable/           # Classic stable app
│   └── wizard/           # Setup wizard
├── components/           # Reusable React components
├── elements/            # Basic web components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── strings/             # Translation files
├── styles/              # Global stylesheets
├── themes/              # UI themes
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## 🛠️ Development Workflow

### Making Changes

1. **Create a New Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make Your Changes**
   - Edit the relevant files
   - Follow the existing code style
   - Add comments where necessary

3. **Test Your Changes**
   ```bash
   # Run the development server
   npm start
   
   # Build for production (optional)
   npm run build:production
   
   # Run linting
   npm run lint
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve issue description"
   ```

### Commit Message Guidelines

We follow conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### Submitting Your Changes

1. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill out the PR template with details about your changes
   - Link any related issues

## 🎯 Good First Issues

New contributors should look for issues labeled with:
- `good first issue` - Perfect for beginners
- `help wanted` - Community help needed
- `documentation` - Documentation improvements

Common beginner-friendly tasks include:
- Fixing typos in documentation
- Updating translation strings
- Improving UI text consistency
- Adding missing accessibility attributes
- Simple bug fixes

## 🌍 Translations

We use [Weblate](https://translate.jellyfin.org/projects/jellyfin/jellyfin-web) for translations:
- **DO NOT** edit translation files directly (except `en-us.json`)
- Use Weblate for all translation work
- Only commit changes to `src/strings/en-us.json`

## 🧪 Testing

### Manual Testing
- Test your changes in multiple browsers
- Test responsive design on different screen sizes
- Verify functionality with different server configurations

### Automated Testing
```bash
# Run tests (when available)
npm test

# Run linting
npm run lint

# Check TypeScript types
npm run type-check
```

## 📋 Code Style Guidelines

### General Guidelines
- Use TypeScript for new code
- Follow existing code patterns
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions small and focused

### React Guidelines
- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow the existing component structure
- Use proper error boundaries

### CSS/SCSS Guidelines
- Use existing CSS classes when possible
- Follow BEM naming convention for new styles
- Use CSS custom properties for theming
- Ensure responsive design

## 🐛 Reporting Issues

When reporting bugs:
1. Check if the issue already exists
2. Use the issue template
3. Provide clear reproduction steps
4. Include browser and server version information
5. Add screenshots if relevant

## 🤝 Getting Help

- **GitHub Discussions**: Ask questions and discuss ideas
- **Matrix Chat**: Join our [Matrix room](https://matrix.to/#/+jellyfin:matrix.org)
- **Reddit**: Visit [r/jellyfin](https://www.reddit.com/r/jellyfin)
- **Documentation**: Check the [official docs](https://jellyfin.org/docs/)

## 📚 Additional Resources

- [Jellyfin Documentation](https://jellyfin.org/docs/)
- [API Documentation](https://api.jellyfin.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) (our architecture guide)

## ⚖️ License

By contributing to Jellyfin Web, you agree that your contributions will be licensed under the GPL-2.0-or-later license.

---

Thank you for contributing to Jellyfin Web! Your efforts help make media streaming better for everyone. 🎉
