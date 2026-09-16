/**
 * solarSystem.js — SOLARIS Phase C & D Upgrades
 * Responsibility: Three.js scene, WebGL renderer, starfield, cosmic nebula gas clouds,
 * lighting, and EffectComposer post-processing (UnrealBloomPass).
 */

import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';

export class SolarSystem {
  constructor() {
    this.scene     = new THREE.Scene();
    this.clock     = new THREE.Clock();
    this._camera   = null;
    this._composer = null;

    this._setupRenderer();
    this._setupLights();
    this._createStarfield();
    this._createNebulaClouds();
    this._setupResizeHandler();
  }

  // ─── Renderer ───────────────────────────────────────────────────────────────

  _setupRenderer() {
    const canvas = document.getElementById('solaris-canvas');

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha:     false,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled  = false;
  }

  // ─── EffectComposer + Bloom ─────────────────────────────────────────────────

  _setupComposer(camera) {
    this._composer = new EffectComposer(this.renderer);
    this._composer.addPass(new RenderPass(this.scene, camera));

    // Refined bloom: highlights Sun core, coronal prominences, and city lights
    this._bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.40,   // strength
      0.52,   // radius
      0.72,   // threshold
    );
    this._composer.addPass(this._bloomPass);
    this._composer.addPass(new OutputPass());
    this._useComposer = true;

    // Apply saved or default quality
    const savedQuality = (typeof localStorage !== 'undefined' && localStorage.getItem('solaris_quality')) || 'high';
    this.setQuality(savedQuality);
  }

  // ─── Lighting ───────────────────────────────────────────────────────────────

  _setupLights() {
    // Balanced ambient — planets reveal surface geology and atmosphere even on dark sides
    const ambient = new THREE.AmbientLight(0x182033, 2.4);
    this.scene.add(ambient);

    // Warm brilliant Sun point light with natural quadratic falloff
    this.sunLight = new THREE.PointLight(0xFFF7EA, 5.2, 750, 1.25);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Subtle galactic rim fill
    const fillLight = new THREE.DirectionalLight(0x336699, 0.6);
    fillLight.position.set(-250, 120, -150);
    this.scene.add(fillLight);

    // Secondary soft opposite fill
    const fillLight2 = new THREE.DirectionalLight(0x223355, 0.4);
    fillLight2.position.set(200, -80, 150);
    this.scene.add(fillLight2);
  }

  // ─── Starfield ──────────────────────────────────────────────────────────────

  _createStarfield() {
    const STAR_COUNT = 10000;
    const positions  = new Float32Array(STAR_COUNT * 3);
    const colors     = new Float32Array(STAR_COUNT * 3);

    const palette = [
      new THREE.Color(1.0,  1.0,  1.0 ),
      new THREE.Color(1.0,  0.96, 0.88),
      new THREE.Color(0.85, 0.92, 1.0 ),
      new THREE.Color(1.0,  0.78, 0.65),
      new THREE.Color(0.65, 0.85, 1.0 ),
      new THREE.Color(1.0,  0.90, 0.70),
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 450 + Math.random() * 250;

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const col        = palette[Math.floor(Math.random() * palette.length)];
      const brightness = 0.55 + Math.random() * 0.45;
      colors[i * 3]     = col.r * brightness;
      colors[i * 3 + 1] = col.g * brightness;
      colors[i * 3 + 2] = col.b * brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size:            1.1,
      sizeAttenuation: true,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.92,
    });

    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  // ─── Deep Space Nebula Clouds ───────────────────────────────────────────────

  _createNebulaClouds() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.25, 'rgba(180, 220, 255, 0.7)');
    grad.addColorStop(0.55, 'rgba(100, 140, 255, 0.35)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const puffTexture = new THREE.CanvasTexture(canvas);

    const NEBULA_PUFFS = 220;
    const positions = new Float32Array(NEBULA_PUFFS * 3);
    const colors    = new Float32Array(NEBULA_PUFFS * 3);

    const nebulaColors = [
      new THREE.Color(0x8a2be2), // blue violet
      new THREE.Color(0x00b4d8), // deep sky cyan
      new THREE.Color(0xd90429), // crimson nebula
      new THREE.Color(0x7209b7), // purple nebula
      new THREE.Color(0xf77f00), // warm starlight amber
    ];

    for (let i = 0; i < NEBULA_PUFFS; i++) {
      const clusterAngle = (i % 6) * (Math.PI * 2 / 6) + (Math.random() - 0.5) * 1.1;
      const r = 320 + Math.random() * 160;
      const y = (Math.random() - 0.5) * 160;

      positions[i * 3]     = Math.cos(clusterAngle) * r + (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(clusterAngle) * r + (Math.random() - 0.5) * 120;

      const col = nebulaColors[i % nebulaColors.length];
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size:            220,
      map:             puffTexture,
      transparent:     true,
      opacity:         0.38,
      blending:        THREE.AdditiveBlending,
      depthWrite:      false,
      vertexColors:    true,
      sizeAttenuation: true,
    });

    this.nebula = new THREE.Points(geo, mat);
    this.scene.add(this.nebula);
  }

  // ─── Resize ─────────────────────────────────────────────────────────────────

  _setupResizeHandler() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.renderer.setSize(w, h);
      if (this._composer) this._composer.setSize(w, h);

      if (this._camera) {
        this._camera.aspect = w / h;
        this._camera.updateProjectionMatrix();
      }
    });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  setCamera(camera) {
    this._camera = camera;
    this._setupComposer(camera);
  }

  setQuality(preset = 'high') {
    this.quality = preset;
    try { localStorage.setItem('solaris_quality', preset); } catch (_) {}

    const w = window.innerWidth;
    const h = window.innerHeight;

    let dpr = 1.0;
    let bloomEnabled = true;
    let bloomStrength = 0.40;

    switch (preset) {
      case 'ultra':
        dpr = Math.min(window.devicePixelRatio, 2.0);
        bloomEnabled = true;
        bloomStrength = 0.48;
        break;
      case 'high':
        dpr = Math.min(window.devicePixelRatio, 1.5);
        bloomEnabled = true;
        bloomStrength = 0.40;
        break;
      case 'balanced':
        dpr = Math.min(window.devicePixelRatio, 1.25);
        bloomEnabled = true;
        bloomStrength = 0.28;
        break;
      case 'performance':
        dpr = 1.0;
        bloomEnabled = false;
        break;
    }

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    if (this._composer) {
      this._composer.setPixelRatio(dpr);
      this._composer.setSize(w, h);
    }

    if (this._bloomPass) {
      this._bloomPass.enabled = bloomEnabled;
      this._bloomPass.strength = bloomStrength;
    }

    this._useComposer = bloomEnabled;
    return preset;
  }

  start(onTick) {
    let frameCount = 0;
    let lastFpsTime = performance.now();
    this.fps = 60;

    const tick = () => {
      requestAnimationFrame(tick);

      // Clamp delta to avoid animation jumping after tab switch or brief stalls
      const rawDelta = this.clock.getDelta();
      const delta = Math.min(rawDelta, 0.1);

      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 500) {
        this.fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;
        if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
      }

      // Cosmic Parallax Drift
      if (this.stars) {
        this.stars.rotation.y += delta * 0.002;
        this.stars.rotation.x += delta * 0.0008;
      }
      if (this.nebula) {
        this.nebula.rotation.y += delta * 0.001;
      }

      onTick(delta);

      if (this._useComposer && this._composer) {
        this._composer.render();
      } else {
        this.renderer.render(this.scene, this._camera);
      }
    };
    tick();
  }
}
