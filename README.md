# Jellyfin Web Modernized

An advanced, high-performance evolution of the Jellyfin Web client, focused on superior audio fidelity, modern state management, and a streamlined developer experience.

---

## 🚀 The Modernization Evolution

This project began as a fork of the official Jellyfin Web client but has since undergone a foundational architectural overhaul. While maintaining compatibility with the Jellyfin ecosystem, we have introduced substantial improvements to the core infrastructure and user experience.

### Key Enhancements

*   **⚡ Next-Gen Build System:** Fully migrated from Webpack to **Vite**. Experience near-instant HMR (Hot Module Replacement) and optimized production builds that are significantly smaller and faster.
*   **🦀 Wasm-Powered Audio Engine:** Features a high-performance **WebAssembly (Rust)** audio processing layer. Our custom Wasm Limiter ensures distortion-free, high-fidelity playback even at high volumes.
*   **🧠 Modern State Management:** Legacy jQuery-style state has been replaced with **Zustand**. This provides a predictable, reactive, and highly performant source of truth for audio playback and UI state.
*   **🎵 Premium Music Experience:** Deeply enhanced music playback featuring:
    *   **Predictive Preloading:** Intelligent asset and stream pre-fetching for gapless transitions.
    *   **Advanced Crossfading:** Studio-quality transitions between tracks.
    *   **Interactive Visualizers:** Integrated Butterchurn (Milkdrop) support for an immersive listening experience.
*   **🛠️ Developer First:** Refactored for modern development with TypeScript, automated quality checks, and a clean, modular architecture.

---

## 🏗️ Build Process

### Dependencies

*   [Node.js](https://nodejs.org/en/download) (>= 20.0.0)
*   npm (>= 9.6.4)

### Getting Started

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/jellyfin/jellyfin-web.git
    cd jellyfin-web
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Start the development server:**
    ```sh
    npm start
    ```
    *Access the client at `http://localhost:8080` (or the port specified in the console).*

4.  **Production Build:**
    ```sh
    npm run build:production
    ```
    *The optimized output will be in the `dist/` directory.*

---

## 📂 Project Structure

We follow a modular architecture aimed at eventually phasing out legacy components.

```text
.
├── src
│   ├── apps            # Dedicated application entry points (Stable, Dashboard, Wizard)
│   ├── components      # Modern React components (MUI based)
│   ├── store           # Zustand state stores (The source of truth)
│   ├── audioEngine     # Wasm-powered audio processing and workers
│   ├── lib             # Core libraries and globalize localization
│   ├── controllers     # Legacy page controllers (Active migration area)
│   └── styles          # Modern SCSS and MUI theme definitions
├── rust-audio          # Rust source for Wasm audio effects
└── scripts             # Build and optimization utilities
```

---

## 🤝 Contributing

We welcome contributions that align with our goal of modernizing the Jellyfin experience. If you're interested in helping with the React/TypeScript migration or the Wasm audio engine, please check out our active issues.

### Quality Standards
Before submitting a PR, please ensure:
*   `npm run lint` passes without errors.
*   `npm run build:check` (TypeScript) passes.
*   `npm test` passes for any changes to core logic.

---

## 📄 License

This project is licensed under the **GPL-2.0-or-later**.
Original branding and assets are property of the Jellyfin Project.