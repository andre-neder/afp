# AFP

A modern desktop application for managing and arranging document pages on an infinite canvas. Built with SolidStart, Tauri, and Three.js.

## Features

- **Infinite Canvas**: Pan and zoom freely to organize your workspace using a high-performance Three.js renderer.
- **Page Management**: Add A4 pages anywhere on the canvas via context menu.
- **Drag & Drop**: Intuitive page positioning with automatic collision detection to prevent overlaps.
- **Page Rotation**: Rotate pages 90 degrees to switch between portrait and landscape orientations.
- **Modern UI**: Clean interface with a resizable sidebar and top menu bar, styled with TailwindCSS.

## Tech Stack

- **Frontend Framework**: [SolidStart](https://start.solidjs.com) (SolidJS)
- **Desktop Engine**: [Tauri v2](https://tauri.app)
- **Graphics**: [Three.js](https://threejs.org)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com)
- **Bundler**: [Vinxi](https://vinxi.vercel.app)
- **Utilities**: `@corvu/resizable` for layout, `@thisbeyond/solid-dnd` for interactions.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v22+ recommended)
- [Bun](https://bun.sh/) (Package manager)
- [Rust](https://www.rust-lang.org/tools/install) (Required for Tauri development)

## Getting Started

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Run in Development Mode**

   To run the web version in your default browser:
   ```bash
   bun run dev
   ```

   To run the desktop application (Tauri):
   ```bash
   bun run dev:native
   ```

## Building

To build the application for production:

```bash
bun run build
```

This will generate the production artifacts in the `.output` directory and the native app bundle.

## Project Structure

- `src/components`: UI components including the main `Slide` canvas (Three.js integration).
- `src/routes`: Application routes and page layouts.
- `src-tauri`: Rust backend configuration and system integrations for Tauri.
