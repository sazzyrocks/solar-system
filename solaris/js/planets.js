/**
 * planets.js — SOLARIS Phase C & D Upgrades
 * Responsibility: Building and animating the Sun, all 8 planets, orbit paths,
 * axial tilts, ring systems, independent cloud layers, atmospheric Fresnel glows,
 * 3D orbiting moons, and dynamic solar prominence flares.
 */

import * as THREE from 'three';
import {
  generatePlanetTexture,
  generateBumpMap,
  generateSpecularMap,
  generateRingTexture,
  generateEarthCloudsTexture,
  generateEarthNightLightsTexture,
  generateMoonTexture,
} from './textureGen.js';

const gsap = window.gsap;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a LineLoop circle in the XZ plane for an orbit path.
 */
function createOrbitPath(radius, color = 0x3A5A8C, opacity = 0.35) {
  const SEGMENTS = 256;
  const points   = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const a = (i / SEGMENTS) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  return new THREE.LineLoop(geo, mat);
}

/**
 * Procedural Sun surface granulation texture.
 */
function createSunTexture(baseColor) {
  const W = 512, H = 256;
  let canvas;
  try { canvas = new OffscreenCanvas(W, H); }
  catch (_) { canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; }
  const ctx = canvas.getContext('2d');

  const img = ctx.createImageData(W, H);
  const d   = img.data;
  const base = new THREE.Color(baseColor);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = x / W * 12;
      const ny = y / H * 12;
      let n = 0, amp = 1, freq = 1, max = 0;
      for (let o = 0; o < 5; o++) {
        const hv = Math.sin(nx * freq * 127.1 + ny * freq * 311.7) * 43758.545;
        n   += (hv - Math.floor(hv)) * amp;
        max += amp; amp *= 0.52; freq *= 2.05;
      }
      n /= max;

      // Golden incandescent solar plasma
      const r = Math.round(Math.min(255, base.r * 255 * (0.85 + n * 0.45)));
      const g = Math.round(Math.min(255, base.g * 255 * (0.65 + n * 0.55)));
      const b = Math.round(Math.min(255, base.b * 255 * (0.15 + n * 0.40)));
      const i = (y * W + x) * 4;
      d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Build glowing Sun mesh with layered corona spheres and 3D solar prominence arches.
 */
function createSun(sunData) {
  const group = new THREE.Group();
  group.name  = 'sun';

  // 1. Core Sphere
  const coreGeo = new THREE.SphereGeometry(sunData.size, 64, 64);
  const coreMat = new THREE.MeshBasicMaterial({
    map: createSunTexture(sunData.color),
  });
  const core    = new THREE.Mesh(coreGeo, coreMat);
  core.name     = 'sun-core';
  group.add(core);

  // 2. Inner Corona — brilliant golden bloom
  const c1Geo = new THREE.SphereGeometry(sunData.size * 1.15, 32, 32);
  const c1Mat = new THREE.MeshBasicMaterial({
    color:       sunData.glowColor,
    transparent: true,
    opacity:     0.32,
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });
  const c1Mesh = new THREE.Mesh(c1Geo, c1Mat);
  c1Mesh.name = 'sun-corona-1';
  group.add(c1Mesh);

  // 3. Mid Corona — warm plasma red
  const c2Geo = new THREE.SphereGeometry(sunData.size * 1.35, 32, 32);
  const c2Mat = new THREE.MeshBasicMaterial({
    color:       0xFF5500,
    transparent: true,
    opacity:     0.18,
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });
  const c2Mesh = new THREE.Mesh(c2Geo, c2Mat);
  c2Mesh.name = 'sun-corona-2';
  group.add(c2Mesh);

  // 4. Outer Corona — expansive soft halo
  const c3Geo = new THREE.SphereGeometry(sunData.size * 1.75, 32, 32);
  const c3Mat = new THREE.MeshBasicMaterial({
    color:       0xFF2200,
    transparent: true,
    opacity:     0.08,
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });
  const c3Mesh = new THREE.Mesh(c3Geo, c3Mat);
  c3Mesh.name = 'sun-corona-3';
  group.add(c3Mesh);

  // 5. 3D Solar Prominence Arches (coronal plasma loops erupting along limb)
  const prominenceGroup = new THREE.Group();
  prominenceGroup.name = 'sun-prominences';

  const flareMat = new THREE.MeshBasicMaterial({
    color:       0xFFAA22,
    transparent: true,
    opacity:     0.75,
    blending:    THREE.AdditiveBlending,
    side:        THREE.DoubleSide,
    depthWrite:  false,
  });

  const flarePositions = [
    { r: sunData.size * 0.98, tube: 0.12, arc: Math.PI * 0.45, rx: 0.2, ry: 0.8, rz: 0.4 },
    { r: sunData.size * 0.97, tube: 0.10, arc: Math.PI * 0.55, rx: 1.4, ry: 0.3, rz: 1.2 },
    { r: sunData.size * 0.99, tube: 0.14, arc: Math.PI * 0.40, rx: 2.1, ry: 1.5, rz: 0.7 },
    { r: sunData.size * 0.96, tube: 0.09, arc: Math.PI * 0.50, rx: 0.9, ry: 2.4, rz: 2.1 },
  ];

  flarePositions.forEach((fp, i) => {
    const flareGeo = new THREE.TorusGeometry(fp.r * 0.45, fp.tube, 16, 48, fp.arc);
    const flareMesh = new THREE.Mesh(flareGeo, flareMat.clone());
    flareMesh.position.set(
      Math.cos(i * 1.5) * sunData.size * 0.85,
      Math.sin(i * 2.1) * sunData.size * 0.45,
      Math.sin(i * 1.5) * sunData.size * 0.85
    );
    flareMesh.rotation.set(fp.rx, fp.ry, fp.rz);
    flareMesh.scale.set(1.0, 1.0, 1.0);
    prominenceGroup.add(flareMesh);
  });

  group.add(prominenceGroup);
  return group;
}

/**
 * Atmospheric Fresnel Limb Glow Mesh.
 * Renders an authentic radiant halo around planets with atmospheres.
 */
function createAtmosphereGlow(radius, hexColor) {
  const atmoGeo = new THREE.SphereGeometry(radius * 1.10, 48, 48);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vEye;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 eyePos = modelViewMatrix * vec4(position, 1.0);
        vEye = normalize(-eyePos.xyz);
        gl_Position = projectionMatrix * eyePos;
      }
    `,
    fragmentShader: `
      uniform vec3 atmoColor;
      varying vec3 vNormal;
      varying vec3 vEye;
      void main() {
        float rim = 1.0 - max(0.0, dot(vNormal, vEye));
        float intensity = pow(rim, 3.0) * 1.45;
        gl_FragColor = vec4(atmoColor, intensity);
      }
    `,
    uniforms: {
      atmoColor: { value: new THREE.Color(hexColor) }
    },
    blending:    THREE.AdditiveBlending,
    side:        THREE.BackSide,
    transparent: true,
    depthWrite:  false,
  });
  return new THREE.Mesh(atmoGeo, atmoMat);
}

// ─── Prominent Moons Configuration ───────────────────────────────────────────

const MOONS_DATA = {
  earth: [
    { id: 'luna', name: 'Moon (Luna)', size: 0.25, dist: 2.3, speed: 1.0, tilt: 5.1 },
  ],
  mars: [
    { id: 'phobos', name: 'Phobos', size: 0.08, dist: 1.15, speed: 1.8, tilt: 1.1 },
    { id: 'deimos', name: 'Deimos', size: 0.06, dist: 1.70, speed: 1.2, tilt: 1.8 },
  ],
  jupiter: [
    { id: 'io',       name: 'Io',       size: 0.38, dist: 4.8, speed: 1.6, tilt: 0.05 },
    { id: 'europa',   name: 'Europa',   size: 0.34, dist: 6.3, speed: 1.2, tilt: 0.47 },
    { id: 'ganymede', name: 'Ganymede', size: 0.52, dist: 8.2, speed: 0.8, tilt: 0.20 },
    { id: 'callisto', name: 'Callisto', size: 0.46, dist: 10.4, speed: 0.5, tilt: 0.28 },
  ],
  saturn: [
    { id: 'titan',     name: 'Titan',     size: 0.54, dist: 10.2, speed: 0.65, tilt: 0.35 },
    { id: 'enceladus', name: 'Enceladus', size: 0.18, dist: 4.6,  speed: 1.40, tilt: 0.02 },
  ],
};

/**
 * Build a planet mesh group (sphere, clouds, atmosphere, rings, and orbiting moons).
 */
function createPlanetMesh(data) {
  const group = new THREE.Group();
  group.name  = data.id;

  // ── Generate procedural textures ────────────────────────────────────────────
  const diffuseMap  = generatePlanetTexture(data.id);
  const bumpMap     = generateBumpMap(data.id);
  const specularMap = generateSpecularMap(data.id);

  // ── Planet sphere — MeshPhongMaterial with enhanced textures & bump ─────────
  const matParams = {
    ...(diffuseMap  ? { map: diffuseMap }          : { color: new THREE.Color(data.color) }),
    ...(bumpMap     ? { bumpMap, bumpScale: 0.65 } : {}),
    ...(specularMap ? { specularMap }              : {}),
    shininess: data.shininess ?? 35,
    specular:  new THREE.Color(0x555555),
    emissive:  new THREE.Color(data.color).multiplyScalar(0.04), // soft visibility on night side
  };

  // Earth night-side city lights
  if (data.id === 'earth') {
    const nightLights = generateEarthNightLightsTexture();
    matParams.emissiveMap = nightLights;
    matParams.emissive = new THREE.Color(0xffea9f);
  }

  const geo = new THREE.SphereGeometry(data.size, 64, 64);
  const mat = new THREE.MeshPhongMaterial(matParams);

  const sphere = new THREE.Mesh(geo, mat);
  sphere.name  = `${data.id}-sphere`;
  sphere.rotation.z = THREE.MathUtils.degToRad(data.tilt ?? 0);
  group.add(sphere);

  // ── Earth 3D Cloud Layer ────────────────────────────────────────────────────
  let cloudMesh = null;
  if (data.id === 'earth') {
    const cloudTex = generateEarthCloudsTexture();
    const cloudGeo = new THREE.SphereGeometry(data.size * 1.022, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map:         cloudTex,
      transparent: true,
      opacity:     0.90,
      blending:    THREE.NormalBlending,
      depthWrite:  false,
      shininess:   10,
    });
    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.name = 'earth-clouds';
    cloudMesh.rotation.z = THREE.MathUtils.degToRad(data.tilt ?? 0);
    group.add(cloudMesh);
  }

  // ── Atmospheric Fresnel Rim Glow ───────────────────────────────────────────
  if (data.atmosphereColor) {
    const atmoGlow = createAtmosphereGlow(data.size, data.atmosphereColor);
    atmoGlow.name = `${data.id}-atmosphere`;
    group.add(atmoGlow);
  }

  // ── Ring system (Saturn, Uranus) ────────────────────────────────────────────
  if (data.hasRings) {
    const rGeo = new THREE.RingGeometry(
      data.size * data.ringInner,
      data.size * data.ringOuter,
      128,
      8,
    );

    // Remap UVs radially
    const pos = rGeo.attributes.position;
    const uv  = rGeo.attributes.uv;
    const v3  = new THREE.Vector3();
    const outerLen = data.size * data.ringOuter;
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      uv.setXY(i, (v3.length() - data.size * data.ringInner) / (outerLen - data.size * data.ringInner), 0.5);
    }

    const ringTex = generateRingTexture(data.ringColor ?? '#C2A45A', {
      opacity: data.ringOpacity ?? 0.85,
    });

    const rMat = new THREE.MeshBasicMaterial({
      map:         ringTex,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     1.0,
      depthWrite:  false,
      alphaTest:   0.005,
    });

    const rings = new THREE.Mesh(rGeo, rMat);
    rings.name  = `${data.id}-rings`;
    rings.rotation.x = Math.PI / 2;
    rings.rotation.z = THREE.MathUtils.degToRad(data.tilt ?? 0);
    group.add(rings);
  }

  // ── 3D Orbiting Moons ──────────────────────────────────────────────────────
  const moonsList = [];
  const moonDefs  = MOONS_DATA[data.id];

  if (moonDefs && moonDefs.length > 0) {
    moonDefs.forEach((mDef) => {
      // Moon pivot centered on planet
      const mPivot = new THREE.Group();
      mPivot.name  = `${mDef.id}-pivot`;
      mPivot.rotation.x = THREE.MathUtils.degToRad(mDef.tilt ?? 0);

      // Faint orbital ring
      const mOrbitPath = createOrbitPath(mDef.dist, 0x5a88c2, 0.18);
      mOrbitPath.name  = `${mDef.id}-orbit`;
      mPivot.add(mOrbitPath);

      // Moon Mesh
      const moonTex = generateMoonTexture(mDef.id);
      const mGeo    = new THREE.SphereGeometry(mDef.size, 32, 32);
      const mMat    = new THREE.MeshPhongMaterial({
        map:       moonTex,
        bumpMap:   moonTex,
        bumpScale: 0.35,
        shininess: 8,
      });
      const mMesh   = new THREE.Mesh(mGeo, mMat);
      mMesh.name    = `${mDef.id}-mesh`;
      mMesh.position.x = mDef.dist;

      mPivot.add(mMesh);
      group.add(mPivot);

      moonsList.push({
        def:   mDef,
        pivot: mPivot,
        mesh:  mMesh,
        angle: Math.random() * Math.PI * 2,
      });
    });
  }

  return { group, cloudMesh, moonsList };
}

// ─── PlanetManager ────────────────────────────────────────────────────────────

export class PlanetManager {
  /**
   * @param {THREE.Scene} scene
   * @param {object}      data   Parsed planets.json
   */
  constructor(scene, data) {
    this.scene       = scene;
    this._sunGroup   = null;
    this._planetObjs = [];

    this._buildSun(data.sun);
    this._buildPlanets(data.planets);
  }

  // ─── Build ──────────────────────────────────────────────────────────────────

  _buildSun(sunData) {
    this._sunGroup = createSun(sunData);
    this.scene.add(this._sunGroup);
  }

  _buildPlanets(planetsData) {
    planetsData.forEach((pData) => {
      const orbitPath = createOrbitPath(pData.orbitRadius);
      this.scene.add(orbitPath);

      const pivot = new THREE.Object3D();
      pivot.name  = `${pData.id}-pivot`;
      this.scene.add(pivot);

      const { group, cloudMesh, moonsList } = createPlanetMesh(pData);
      group.position.x = pData.orbitRadius;
      pivot.add(group);

      const startAngle = Math.random() * Math.PI * 2;
      pivot.rotation.y = startAngle;

      this._planetObjs.push({
        pivot,
        group,
        data:      pData,
        angle:     startAngle,
        orbitLine: orbitPath,
        cloudMesh,
        moonsList,
      });
    });
  }

  // ─── Animation ──────────────────────────────────────────────────────────────

  /**
   * Advance all orbital, self-rotation, cloud, flare, and moon animations.
   * @param {number} deltaSimDays
   */
  update(deltaSimDays) {
    // 1. Sun Convective Rotation & Pulsing Prominences
    if (this._sunGroup) {
      this._sunGroup.rotation.y += ((2 * Math.PI) / 25.38) * deltaSimDays;

      // Pulsing coronal breathing
      const now = performance.now() * 0.001;
      const c1 = this._sunGroup.getObjectByName('sun-corona-1');
      const c2 = this._sunGroup.getObjectByName('sun-corona-2');
      if (c1) c1.scale.setScalar(1.0 + Math.sin(now * 1.8) * 0.03);
      if (c2) c2.scale.setScalar(1.0 + Math.cos(now * 1.2) * 0.04);

      // Prominence arches rotating slowly along solar surface
      const prominences = this._sunGroup.getObjectByName('sun-prominences');
      if (prominences) {
        prominences.rotation.y += deltaSimDays * 0.02;
        prominences.children.forEach((fl, idx) => {
          fl.scale.setScalar(1.0 + Math.sin(now * 2.5 + idx * 1.4) * 0.08);
        });
      }
    }

    // 2. Planets, Clouds & Moons
    this._planetObjs.forEach((obj) => {
      // Orbital Period
      const yearDays = obj.data.yearLength || 365.25;
      const orbitalAngularSpeed = (2 * Math.PI) / yearDays;
      obj.angle += orbitalAngularSpeed * deltaSimDays;
      obj.pivot.rotation.y = obj.angle;

      // Planet Self-Rotation
      const sphere = obj.group.getObjectByName(`${obj.data.id}-sphere`);
      if (sphere) {
        const dayInEarthDays = (Math.abs(obj.data.dayLength) || 24) / 24;
        const sign = (obj.data.rotationSpeed ?? 1) < 0 ? -1 : 1;
        const rotSpeed = ((2 * Math.PI) / dayInEarthDays) * sign;
        sphere.rotation.y += Math.min(Math.max(rotSpeed * deltaSimDays * 0.1, -1.0), 1.0);
      }

      // Independent Earth Cloud Drift
      if (obj.cloudMesh) {
        obj.cloudMesh.rotation.y += deltaSimDays * 0.06;
      }

      // Rings Slow Rotation
      if (obj.data.hasRings) {
        const rings = obj.group.getObjectByName(`${obj.data.id}-rings`);
        if (rings) rings.rotation.z += deltaSimDays * 0.005;
      }

      // 3D Moons Orbital Revolution
      if (obj.moonsList && obj.moonsList.length > 0) {
        obj.moonsList.forEach((m) => {
          m.angle += deltaSimDays * 0.15 * m.def.speed;
          m.pivot.rotation.y = m.angle;
          m.mesh.rotation.y  += deltaSimDays * 0.1;
        });
      }
    });
  }

  // ─── Hover highlight API ────────────────────────────────────────────────────

  highlightPlanet(id) {
    const obj = this._planetObjs.find(o => o.data.id === id);
    if (!obj) return;

    gsap.killTweensOf(obj.group.scale);
    gsap.to(obj.group.scale, {
      x: 1.15, y: 1.15, z: 1.15,
      duration: 0.38,
      ease: 'back.out(1.8)',
    });

    const sphere = obj.group.getObjectByName(`${id}-sphere`);
    if (sphere?.material) {
      const hc = new THREE.Color(obj.data.color);
      gsap.killTweensOf(sphere.material.emissive);
      gsap.to(sphere.material.emissive, {
        r: hc.r * 0.45,
        g: hc.g * 0.45,
        b: hc.b * 0.45,
        duration: 0.38,
      });
    }

    if (obj.orbitLine?.material) {
      gsap.killTweensOf(obj.orbitLine.material);
      gsap.killTweensOf(obj.orbitLine.material.color);
      gsap.to(obj.orbitLine.material,       { opacity: 0.85, duration: 0.28 });
      gsap.to(obj.orbitLine.material.color, { r: 0.42, g: 0.75, b: 1.0, duration: 0.28 });
    }
  }

  unhighlightPlanet(id) {
    const obj = this._planetObjs.find(o => o.data.id === id);
    if (!obj) return;

    gsap.killTweensOf(obj.group.scale);
    gsap.to(obj.group.scale, {
      x: 1.0, y: 1.0, z: 1.0,
      duration: 0.42,
      ease: 'power2.out',
    });

    const sphere = obj.group.getObjectByName(`${id}-sphere`);
    if (sphere?.material) {
      const hc = new THREE.Color(obj.data.color);
      gsap.killTweensOf(sphere.material.emissive);
      gsap.to(sphere.material.emissive, {
        r: hc.r * 0.04,
        g: hc.g * 0.04,
        b: hc.b * 0.04,
        duration: 0.42,
      });
    }

    if (obj.orbitLine?.material) {
      gsap.killTweensOf(obj.orbitLine.material);
      gsap.killTweensOf(obj.orbitLine.material.color);
      gsap.to(obj.orbitLine.material,       { opacity: 0.35, duration: 0.42 });
      gsap.to(obj.orbitLine.material.color, { r: 0.226, g: 0.353, b: 0.549, duration: 0.42 });
    }
  }

  // ─── Public Accessors ───────────────────────────────────────────────────────

  getPlanetObjects() { return this._planetObjs; }
  getSun()          { return this._sunGroup; }

  getPlanetWorldPosition(id) {
    const obj = this._planetObjs.find(o => o.data.id === id);
    if (!obj) return null;
    const wp = new THREE.Vector3();
    obj.group.getWorldPosition(wp);
    return wp;
  }

  getPlanetObject(id) {
    return this._planetObjs.find(o => o.data.id === id) ?? null;
  }
}
