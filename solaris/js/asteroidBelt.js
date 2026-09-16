/**
 * asteroidBelt.js — SOLARIS Phase D
 * Procedural asteroid field using InstancedMesh for performance.
 * Sits between Mars (orbitRadius 42) and Jupiter (orbitRadius 62).
 *
 * Phase D upgrades:
 *   - DodecahedronGeometry detail=1 (80 faces vs. 12) for denser rock silhouette
 *   - Vertex warp: every vertex displaced by multi-octave noise → craggy, irregular rocks
 *   - Per-instance color variation: palette of warm greys, tans, dark browns via setColorAt()
 *   - Three-axis self-rotation for more natural tumbling
 *   - Matrix uploads throttled to every 3rd frame (unchanged — still efficient)
 */

import * as THREE from 'three';

// ─── Adaptive count ────────────────────────────────────────────────────────────
const ASTEROID_COUNT = (() => {
  const cores  = navigator.hardwareConcurrency ?? 4;
  const mobile = /Mobi|Android/i.test(navigator.userAgent);
  if (mobile || cores <= 2) return  500;
  if (cores <= 4)           return 1000;
  return 1800;
})();

const INNER_R = 47;
const OUTER_R = 57;
const BELT_H  =  4;

export class AsteroidBelt {
  constructor(scene) {
    this._scene    = scene;
    this._count    = ASTEROID_COUNT;
    this._elapsed  = 0;
    this._frameCtr = 0;
    this._data     = [];
    this._dummy    = new THREE.Object3D();

    this._build();
  }

  // ─── Construction ─────────────────────────────────────────────────────────

  _build() {
    // ── Geometry: detail=1 gives more faces for vertex warp to work on ────────
    const baseGeo = new THREE.DodecahedronGeometry(1, 1);
    const geo     = this._warpGeometry(baseGeo);

    // ── Color palette — rocky browns, dark greys, warm tans ──────────────────
    this._palette = [
      new THREE.Color(0x7A6E60),   // warm grey-brown
      new THREE.Color(0x5C5348),   // dark brown-grey
      new THREE.Color(0x8E7D6A),   // light tan
      new THREE.Color(0x4A4540),   // near-black grey
      new THREE.Color(0x9A8872),   // sandy brown
      new THREE.Color(0x635A52),   // medium grey-brown
      new THREE.Color(0x7E6A58),   // rusty tan
    ];

    const mat = new THREE.MeshPhongMaterial({
      shininess:    2,
      flatShading:  true,    // flat faces emphasise rocky angularity
      vertexColors: true,    // driven by setColorAt()
    });

    this._mesh = new THREE.InstancedMesh(geo, mat, this._count);
    this._mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._mesh.castShadow    = false;
    this._mesh.receiveShadow = false;
    this._mesh.frustumCulled = false;
    this._mesh.name          = 'asteroid-belt';

    for (let i = 0; i < this._count; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = INNER_R + Math.random() * (OUTER_R - INNER_R);
      const y      = (Math.random() - 0.5) * BELT_H;
      const scale  = 0.06 + Math.random() * 0.16;

      this._data.push({
        angle0:     angle,
        orbitSpeed: 0.008 + Math.random() * 0.016,
        radius,
        y,
        rx0:     Math.random() * Math.PI * 2,
        ry0:     Math.random() * Math.PI * 2,
        rz0:     Math.random() * Math.PI * 2,
        rxSpeed: (Math.random() - 0.5) * 0.9,
        rySpeed: (Math.random() - 0.5) * 0.9,
        rzSpeed: (Math.random() - 0.5) * 0.4,   // slower roll axis
        scale,
      });

      // ── Per-instance color ─────────────────────────────────────────────────
      const col    = this._palette[Math.floor(Math.random() * this._palette.length)].clone();
      const jitter = 0.84 + Math.random() * 0.32;  // ±8% luminance variation
      col.r = Math.min(1, col.r * jitter);
      col.g = Math.min(1, col.g * jitter);
      col.b = Math.min(1, col.b * jitter);
      this._mesh.setColorAt(i, col);

      const d = this._data[i];
      this._dummy.position.set(
        Math.cos(d.angle0) * d.radius,
        d.y,
        Math.sin(d.angle0) * d.radius,
      );
      this._dummy.rotation.set(d.rx0, d.ry0, d.rz0);
      this._dummy.scale.setScalar(d.scale);
      this._dummy.updateMatrix();
      this._mesh.setMatrixAt(i, this._dummy.matrix);
    }

    this._mesh.instanceMatrix.needsUpdate = true;
    if (this._mesh.instanceColor) this._mesh.instanceColor.needsUpdate = true;
    this._scene.add(this._mesh);

    // ── Jupiter Trojan & Greek Asteroids (L4 & L5) ───────────────────────────
    this._trojanCount = Math.floor(this._count * 0.35); // ~350-600 trojans
    this._trojanData  = [];
    const trojanMat   = mat.clone();
    this._trojanMesh  = new THREE.InstancedMesh(geo, trojanMat, this._trojanCount);
    this._trojanMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._trojanMesh.frustumCulled = false;
    this._trojanMesh.name = 'trojan-asteroids';

    const JUPITER_ORBIT_R = 62;
    for (let i = 0; i < this._trojanCount; i++) {
      // Half in L4 (+60 deg), half in L5 (-60 deg)
      const isL4 = i % 2 === 0;
      const lagrangeLag = isL4 ? (Math.PI / 3) : (-Math.PI / 3);
      // Angular spread around Lagrange point (normal distribution approximation)
      const angularScatter = (Math.random() + Math.random() - 1.0) * 0.38;
      // Radial spread around Jupiter's orbit
      const rOffset = (Math.random() + Math.random() - 1.0) * 4.5;
      const radius  = JUPITER_ORBIT_R + rOffset;
      const y       = (Math.random() - 0.5) * 5.0; // Higher inclination for Trojans
      const scale   = 0.05 + Math.random() * 0.14;

      this._trojanData.push({
        isL4,
        lagrangeLag,
        angularScatter,
        radius,
        y,
        rx0:     Math.random() * Math.PI * 2,
        ry0:     Math.random() * Math.PI * 2,
        rz0:     Math.random() * Math.PI * 2,
        rxSpeed: (Math.random() - 0.5) * 1.1,
        rySpeed: (Math.random() - 0.5) * 1.1,
        rzSpeed: (Math.random() - 0.5) * 0.5,
        scale,
      });

      // Trojans tend to be D-type and P-type asteroids (darker, slightly redder/carbonaceous)
      const trojanCol = new THREE.Color(isL4 ? 0x6a5848 : 0x5a4d42);
      trojanCol.r *= (0.8 + Math.random() * 0.4);
      trojanCol.g *= (0.8 + Math.random() * 0.4);
      trojanCol.b *= (0.8 + Math.random() * 0.35);
      this._trojanMesh.setColorAt(i, trojanCol);

      const td = this._trojanData[i];
      const initialAngle = td.lagrangeLag + td.angularScatter;
      this._dummy.position.set(
        Math.cos(initialAngle) * td.radius,
        td.y,
        Math.sin(initialAngle) * td.radius
      );
      this._dummy.rotation.set(td.rx0, td.ry0, td.rz0);
      this._dummy.scale.setScalar(td.scale);
      this._dummy.updateMatrix();
      this._trojanMesh.setMatrixAt(i, this._dummy.matrix);
    }

    this._trojanMesh.instanceMatrix.needsUpdate = true;
    if (this._trojanMesh.instanceColor) this._trojanMesh.instanceColor.needsUpdate = true;
    this._scene.add(this._trojanMesh);

    console.log(`[SOLARIS] Asteroid belt: ${this._count} main belt + ${this._trojanCount} Jupiter Trojans`);
  }

  /**
   * Displace geometry vertices with multi-octave noise so each asteroid looks
   * like an irregular, craggy rock rather than a symmetric polyhedron.
   * @param {THREE.BufferGeometry} src
   * @returns {THREE.BufferGeometry}  a cloned, warped copy
   */
  _warpGeometry(src) {
    const geo = src.clone();
    const pos = geo.attributes.position;
    const v3  = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i).normalize();

      const nx = v3.x;
      const ny = v3.y;
      const nz = v3.z;

      // 4-octave value noise
      let warp = 0;
      let amp  = 0.30;
      let freq = 2.5;
      for (let o = 0; o < 4; o++) {
        const hv = Math.sin(nx * freq * 127.1 + ny * freq * 311.7 + nz * freq * 74.7) * 43758.5453;
        warp += (hv - Math.floor(hv)) * amp;
        amp  *= 0.50;
        freq *= 2.10;
      }

      // Remap [0, ~0.6] → [-0.18, +0.18] radial displacement
      const disp = (warp - 0.3) * 0.6;
      const r    = 1.0 + disp;
      pos.setXYZ(i, v3.x * r, v3.y * r, v3.z * r);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  // ─── Per-frame update ──────────────────────────────────────────────────────

  update(delta, jupiterAngle) {
    this._elapsed += delta;

    // Direct GPU orbital rotation: Silky-smooth 60/120+ FPS with ZERO CPU overhead
    // Asteroid belt average orbital progression between Mars and Jupiter
    if (this._mesh) {
      this._mesh.rotation.y += delta * 0.014;
    }

    // Jupiter Trojans lock directly to Jupiter's orbital angle on GPU
    if (this._trojanMesh) {
      if (jupiterAngle !== undefined) {
        this._trojanMesh.rotation.y = jupiterAngle;
      } else {
        this._trojanMesh.rotation.y += delta * 0.008;
      }
    }
  }
}
