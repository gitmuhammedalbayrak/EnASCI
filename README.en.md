# 🎮 EnASCI - 3D ASCII Game Engine & Retro RPG

[![GitHub Pages Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen?style=for-the-badge&logo=github)](https://gitmuhammedalbayrak.github.io/EnASCI/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Pure CPU](https://img.shields.io/badge/Software_Rasterizer-Zero_Dependencies-orange?style=for-the-badge)](#)

[🇹🇷 Türkçe Dokümantasyon](README.md) | [🇬🇧 English Documentation](README.en.md)

---

**EnASCI** is a modular, zero-dependency **3D ASCII Game Engine & Retro RPG Adventure** built entirely on a custom **Pure CPU Software 3D Rasterizer** with Barycentric coordinates and perspective-correct Z-buffering.

Running smoothly at **60 FPS** in standard web browsers on an HTML5 Monospace Canvas, the engine features its own 3D math pipeline, an isometric RPG camera follow system, procedurally wind-swaying grass blades, an interactive typewriter dialogue system, and an **8-bit chiptune Web Audio synthesizer** built without any external audio samples.

The engine's architecture is purposely designed with flat buffer layouts and standalone linear algebra, making it directly portable to **native terminal environments in C, C++, or Rust (ncurses / Windows Console API)**.

---

## 🕹️ Live Interactive Demo

Play directly in your browser:  
👉 **[https://gitmuhammedalbayrak.github.io/EnASCI/](https://gitmuhammedalbayrak.github.io/EnASCI/)**

---

## 🌟 Key Features

### ⚔️ 1. Retro RPG Adventure Scene
- **Isometric / Top-Down Tracking Camera:** Smooth lerp camera tracking the player character with authentic isometric projection angles.
- **Player Character:** 8-directional movement with WASD or Arrow Keys, orientation alignment, and walking bobbing animations.
- **Procedural Waving Grass:** Dozens of grass tufts animated in real-time using harmonic wind wave mathematics ($A \cdot \sin(\text{time} + x + z)$).
- **Environment & Trees:** Procedural 3D pine trees (trunks and multi-tier foliage pyramids) and terrain floor.
- **Interactive NPC & Typewriter Dialogue:**
  - Approach Elder Mage Merlin to trigger interaction prompt `[E] TALK`.
  - Typewriter text effect with retro blip sounds (`+---...---+` ASCII dialogue box).
  - Press `[Space]` or `[E]` to progress through the story.
- **In-Engine Main Menu:** Press `[ESC]` anytime to open the pause menu with a rotating 3D ASCII backdrop.

### 🎵 2. 8-Bit Chiptune Audio Synthesizer
Zero external `.mp3` or `.wav` files! Synthesizes vintage 8-bit sound in real-time via the browser's native **Web Audio API**:
- **Square Wave:** Nostalgic NES/Game Boy lead melodies.
- **Triangle Wave:** Warm bass lines and walking rhythm.
- **Noise / Percussion:** High-frequency chirp hi-hats and snare hits.
- **Retro SFX:** Typewriter character blips and menu navigation sounds.

### 📐 3. Pure CPU Software 3D Pipeline
- **Vector & Matrix Math (`src/math.js`):** `Vec2`, `Vec3` (vector arithmetic, dot, cross, normalize), `Mat4` (Translation, RotationX/Y/Z, Scale, Perspective Projection, LookAt view matrix).
- **Barycentric Rasterization:** Transforms triangles into screen space and rasterizes fragments using barycentric coordinates (`w0, w1, w2`).
- **Perspective-Correct Z-Buffering:** Resolves depth sorting and surface overlap with reciprocal depth ($1/z$) interpolation.
- **Backface Culling & Near-Plane Clipping:** Culls non-camera-facing triangles to maximize software rendering performance.
- **Dithering:** Smooths ASCII character density transitions.

### 🎨 4. Multi-Mode Shading & CRT Themes
- **Shading Modes:**
  - `color`: Directional lighting blended with surface RGB tint.
  - `shaded`: Classic Lambertian Diffuse ($N \cdot L$) + Ambient + Specular highlights.
  - `wireframe`: Bresenham line algorithm rendered in ASCII (`+`, `-`, `/`, `\`, `|`).
  - `normals`: Encodes surface normal directions into ASCII glyphs (`^`, `v`, `<`, `>`, `O`).
  - `depth`: Z-Buffer depth map visualization.
  - `textured`: UV-mapped procedural checkerboard textures.
- **Character Density Sets (Ramps):**
  - Standard (` .:-=+*#%@`), Detailed (70 characters), Blocks (` ░▒▓█`), Matrix Code (`0123...F`).
- **Retro Phosphor Themes:**
  - Full Color RGB, Matrix Phosphor Green, Amber CRT, Monochrome, Cyberpunk Neon.

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| **`W` / `A` / `S` / `D` or Arrow Keys** | Move player in 8 directions |
| **`E` or `Space`** | Talk to NPC (Merlin) / Advance dialogue |
| **`ESC`** | Open / Close Main Menu & Pause Game |
| **Mouse Left Drag** | Orbit camera 360° (in Orbit Camera mode) |
| **Mouse Wheel** | Zoom In / Out |
| **📋 Button** | Copy current frame as raw ASCII text to clipboard |

---

## 🚀 Running Locally

### Option 1: Direct File Opening
Double-click `index.html` in your browser. No web server needed!

### Option 2: Node.js Dev Server
```bash
node server.js
# or: npm start
```
Open **`http://localhost:3000`** in your browser.

### Option 3: Python Server
```bash
python -m http.server 3000
```

---

## 📁 Project Structure

```text
EnASCI/
│
├── index.html            # Main game view, UI HUD and sandbox
├── server.js             # Zero-dependency local development server
├── package.json          # Package metadata
├── README.md             # Turkish Documentation
├── README.en.md          # English Documentation
│
├── dist/
│   └── enasci.bundle.js  # Standalone UMD / Browser engine bundle
│
└── src/
    ├── math.js           # Vec2, Vec3, Mat4 3D math library
    ├── mesh.js           # Vertex, Triangle, Mesh primitives & OBJ parser
    ├── scene.js          # Scene, Camera, DirectionalLight
    ├── renderer.js       # FrameBuffer, Z-Buffer, Rasterizer, Shaders
    ├── display.js        # Monospace Canvas & ASCII text presenter
    ├── audio.js          # 8-Bit Web Audio chiptune synth & SFX
    ├── dialogue.js       # RPG typewriter dialogue system
    ├── world.js          # Player, grass blades, trees, NPC & isometric camera
    └── engine.js         # Core game loop, input handling, FPS counter
```

---

## 🛠️ Native System (C / C++ / Rust) Porting Roadmap

Because EnASCI is built strictly on contiguous numeric buffers and elementary arithmetic, it maps 1:1 to native console/terminal applications:

| EnASCI Module | JavaScript / Web Layer | C / C++ / Rust Native Target |
| :--- | :--- | :--- |
| **Buffers** | `chars[]`, `depth[]`, `colors[]` | `char chars[W*H]`, `float depth[W*H]`, `uint32_t colors[W*H]` |
| **Rasterizer** | Barycentric nested loops | SIMD (AVX2/NEON) & OpenMP parallelized CPU loops |
| **Terminal Output** | Canvas `fillText` | Windows: `WriteConsoleOutputW` / Linux: `ncurses` or ANSI escape codes |
| **Input** | DOM Events | `GetAsyncKeyState` (Win32) / `termios` (POSIX) |
| **Audio** | Web Audio API | PortAudio / SDL_Audio / miniaudio square/triangle oscillators |

---

## 📄 License

This project is licensed under the MIT License.
