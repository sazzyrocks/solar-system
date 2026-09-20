# 🌌 SOLARIS — Interactive 3D Solar System Explorer

[![Three.js](https://img.shields.io/badge/Three.js-0.165.0-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![GSAP](https://img.shields.io/badge/GSAP-3.12.5-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> *"What started as a simple idea to teach my siblings about the solar system using a real-time, interactive 3D model turned into **SOLARIS** — a full-scale, cinematic space exploration experience."*

---

## 📖 The Story Behind SOLARIS

Textbooks and 2D diagrams never quite captured the sheer scale and beauty of our cosmic neighborhood when I was explaining the planets to my younger siblings. I wanted to build something they could actually **touch, orbit, and explore** in real-time — seeing why Mercury zips past so fast while Neptune takes decades, how Saturn's rings tilt, and where humanity's rovers have landed.

**SOLARIS** was crafted to bridge curiosity and scientific accuracy, pairing high-performance WebGL graphics with educational depth.

---

## ✨ Key Features

- **🪐 Interactive 3D Solar System**: Real-time rendering of the Sun, 8 major planets, axial tilts, and planetary rings using Three.js with UnrealBloom post-processing glow.
- **⏱️ Proportional Simulation Speed**: Speed up simulation ($1\times, 10\times, 100\times, 1,000\times$) with clean live controls where every planet moves proportionally to its real astronomical orbital period ($T \propto a^{3/2}$).
- **🚀 Real 3D Spacecraft Missions**: Live 3D spacecraft tracking (Voyager 1/2, JWST, Cassini, Parker Solar Probe, Artemis II, New Horizons) with real trajectories and interactive dossiers.
- **🏷️ NASA Eyes Floating 3D Labels**: Screen-projected 3D labels for planets, stars, and spacecraft that track camera perspective in real-time.
- **🛰️ Asteroid Belt & Trojan Swarms**: GPU-accelerated field of thousands of rocky asteroids between Mars and Jupiter plus Jupiter L4 & L5 Trojan asteroid swarms using `THREE.InstancedMesh`.
- **🤖 SOLARIS AI Space Guide**: Integrated AI assistant with an offline astronomical knowledge base that answers space questions and parses natural language travel commands (*"Take me to Mars"*, *"Fly to Saturn"*) to pilot the 3D camera.
- **🎬 Buttery Smooth Cinematic Camera**: Zero-jitter lerp tracking, silky OrbitControls damping (`0.042`), smooth wheel zooming, and GSAP organic flights (`power2.inOut`) across all celestial bodies.
- **🔎 Autocomplete Search**: Search indexing the Sun, all 8 planets, and notable moons (Titan, Europa, Ganymede, Triton, Enceladus).
- **🔊 Procedural Ambient Sound**: Deep-space drone synthesized in real-time using the Web Audio API without external audio files.
- ## ✨ Features

- 🌍 Interactive Solar System visualization
- ☀️ Sun and planetary orbit simulation
- 🪐 Interactive planet exploration
- 🌌 Space-themed visual experience
- 🎮 User-friendly controls
- 📱 Responsive design

## 🚀 Future Improvements

- Add planet information cards
- Add realistic planetary textures
- Add animation speed controls
- Add mobile touch controls
- Add more detailed astronomical data
---

## 🕹️ Controls & Navigation

| Action | Control |
| :--- | :--- |
| **Smooth Orbit / Rotate View** | Left Click + Drag (Inertial glide) |
| **Smooth Zoom In / Out** | Mouse Wheel (Silky progressive steps) |
| **Pan Camera** | Right Click + Drag |
| **Quick Fly to Planet** | Press `1` to `8` keys or click any planet label |
| **Select / Inspect Body** | Click on any planet or search in the top-right bar |
| **Reset to Overview** | Press `ESC` or click "← SOLAR SYSTEM" |
| **Toggle Tour** | Click "CINEMATIC TOUR" for an automated planetary flyby |
| **Simulation Speed** | Use the bottom scrubber slider to change orbital rate |
| **Audio Toggle** | Click the speaker icon (bottom-left) |
| **Ask Space Guide** | Click the AI icon (bottom-right) |

---

## 🛠️ Tech Stack

- **3D Rendering**: [Three.js](https://threejs.org/) (`r165`)
- **Animation Engine**: [GSAP 3](https://greensock.com/gsap/)
- **Post-Processing**: `EffectComposer`, `UnrealBloomPass`, `OutputPass`
- **Audio Engine**: Web Audio API (Multi-oscillator procedural synthesis)
- **UI & Styling**: Vanilla HTML5 & CSS3 (Glassmorphism, CSS Grid, Custom Tokens)
- **Data Layer**: Clean modular JSON (`planets.json`, `missions.json`) with offline fallbacks

---

## 🚀 Deployment (Vercel)

This repository is pre-configured with optimized [`vercel.json`](./vercel.json) rewrites:

1. Import this repository into **[Vercel](https://vercel.com/)**.
2. Deploy directly — the custom rewrites automatically route traffic to the `/solaris/` application cleanly.
3. Every push to `main` will trigger an automated build and instant redeploy.

---

## 💻 How to Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/SajalPorey/solar-system.git
cd solar-system/solaris
```

### 2. Start a local server
Since SOLARIS uses modern ES Modules and JSON datasets, run any local server:

**Using Node.js / npx:**
```bash
npx -y serve . --listen 5173
```

**Using Python:**
```bash
python -m http.server 5173
```

**Using VS Code:**
Right-click `index.html` and select **"Open with Live Server"**.

Open your browser and visit: **`http://localhost:5173`**

---

## 📁 Project Structure

```
solaris/
├── index.html        # Main application layout & HUD components
├── style.css         # Glassmorphism design system & animations
├── app.js            # Main bootstrap & simulation render loop
├── proxy.js          # Optional CORS proxy for Anthropic API
├── data/
│   ├── planets.json  # Physical & orbital parameters for Sun and planets
│   └── missions.json # Space missions dataset
└── js/
    ├── solarSystem.js   # Three.js scene, lighting & bloom post-processing
    ├── camera.js        # GSAP camera transitions & OrbitControls
    ├── planets.js       # Proportional orbital physics & planet meshes
    ├── asteroidBelt.js  # InstancedMesh procedural asteroid field
    ├── missions3D.js    # Real-time 3D spacecraft models & orbital positions
    ├── labels3D.js      # Screen-projected 3D floating labels
    ├── audio.js         # Web Audio procedural sound synthesizer
    ├── ui.js            # HUD, Search, Time Machine & Missions UI
    ├── interactions.js  # Raycasting, hover highlights & navigation
    └── assistant.js     # AI Space Guide chat & navigation parser
```

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for details.

