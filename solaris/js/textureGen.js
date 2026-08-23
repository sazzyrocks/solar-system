/**
 * textureGen.js — SOLARIS Texture System
 *
 * Procedurally generates Three.js CanvasTextures for every planet in the
 * solar system.  All painting is done on 2-D canvas elements at startup so
 * there are no external network requests and no per-frame GPU uploads.
 *
 * Public API
 * ----------
 *  generatePlanetTexture(id)  → THREE.CanvasTexture   (diffuse / color map)
 *  generateBumpMap(id)        → THREE.CanvasTexture   (grayscale height)
 *  generateSpecularMap(id)    → THREE.CanvasTexture   (shininess mask)
 *  generateRingTexture(color) → THREE.CanvasTexture   (radial ring bands)
 */

import * as THREE from 'three';

// ─── Low-quality pseudo-noise helpers ──────────────────────────────────────────
// We don't import a noise library; instead we use a hash-based value noise
// that is fast enough for a 512×256 texture bake.

function hash(x, y) {
  // Wang hash — returns [0, 1)
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Smooth value noise sampled at (x, y) where x/y are float coordinates.
 * Returns [0, 1].
 */
function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  // Smoothstep
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash(ix,     iy    );
  const b = hash(ix + 1, iy    );
  const c = hash(ix,     iy + 1);
  const d = hash(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

/**
 * Fractal (fBm) noise — sum of octaves.
 * @param {number} x
 * @param {number} y
 * @param {number} octaves
 * @param {number} persistence  amplitude scaling per octave (0.5 = typical)
 * @param {number} lacunarity   frequency scaling per octave (2.0 = typical)
 * @returns {number} [0, 1]
 */
function fbm(x, y, octaves = 5, persistence = 0.5, lacunarity = 2.0) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue  = 0;

  for (let o = 0; o < octaves; o++) {
    value    += valueNoise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return value / maxValue;
}

// ─── Canvas factory ────────────────────────────────────────────────────────────

/**
 * Create an OffscreenCanvas (or regular canvas if unavailable) and return
 * { canvas, ctx, w, h }.
 */
function makeCanvas(w = 512, h = 256) {
  let canvas;
  try {
    canvas = new OffscreenCanvas(w, h);
  } catch (_) {
    canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
  }
  return { canvas, ctx: canvas.getContext('2d'), w, h };
}

/**
 * Wrap a canvas into a Three.js CanvasTexture with sensible defaults.
 */
function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Convert a canvas into a grayscale bump/specular texture.
 */
function toLinearTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  // Linear (no color-space conversion) for bump / specular maps
  return tex;
}

// ─── Utility: set a pixel ──────────────────────────────────────────────────────

function setPixel(data, x, y, w, r, g, b, a = 255) {
  const i = (y * w + x) * 4;
  data[i]     = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

// ─── Lerp helper ──────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

// ─── Individual planet painters ───────────────────────────────────────────────

const painters = {

  // ──────────────────────────────────────────────────────────────────── Mercury
  mercury: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x / w * 6;
          const ny = y / h * 3;
          const n  = fbm(nx, ny, 6, 0.55, 2.1);
          // Greyscale cratered surface: mid-grey with variation
          const base = lerp(120, 185, n);
          // Dark crater rings scattered with hash
          const cr = hash(Math.floor(nx * 4), Math.floor(ny * 4));
          const craterDark = cr < 0.08 ? 0.6 : 1.0;
          const v = clamp(base * craterDark, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 6, y / h * 3, 5, 0.5, 2);
          const v = clamp(n * 255, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      // Mercury has no ocean, very low specular everywhere
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ──────────────────────────────────────────────────────────────────── Venus
  venus: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx  = x / w;
          // Horizontal cloud bands with turbulence
          const band = fbm(nx * 3 + 0.7, ny * 6, 5, 0.6, 2.2);
          const turb = fbm(nx * 8,       ny * 8, 4, 0.5, 2.0) * 0.35;
          const v    = clamp(band + turb, 0, 1);

          // Palette: deep orange → pale yellow → cream
          const r = clamp(lerp(200, 240, v), 0, 255);
          const g = clamp(lerp(130, 210, v), 0, 255);
          const b = clamp(lerp( 40,  90, v), 0, 255);
          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 5, y / h * 5, 4, 0.55, 2);
          const v = clamp(n * 255, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      // Venus is cloud-covered: moderate uniform specular
      ctx.fillStyle = '#484020';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ──────────────────────────────────────────────────────────────────── Earth
  earth: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;

      for (let y = 0; y < h; y++) {
        const ny  = y / h;                        // 0 = north pole, 1 = south
        const lat = (ny - 0.5) * Math.PI;         // latitude in rad

        for (let x = 0; x < w; x++) {
          const nx = x / w;

          // Continent mask via fBm
          const land = fbm(nx * 4 + 2.3, ny * 4 + 1.1, 6, 0.58, 2.1);
          const isLand = land > 0.525;

          // Ice caps
          const abslat = Math.abs(lat);
          const iceCap = abslat > 1.25;
          const iceBlend = clamp((abslat - 1.25) / 0.15, 0, 1);

          let r, g, b;

          if (iceCap) {
            r = g = b = clamp(lerp(200, 255, iceBlend), 0, 255);
          } else if (isLand) {
            // Land: brownish green with fbm variation
            const veg = fbm(nx * 8, ny * 8, 4, 0.5, 2);
            r = clamp(lerp( 70, 140, veg), 0, 255);
            g = clamp(lerp( 95, 155, veg), 0, 255);
            b = clamp(lerp( 35,  70, veg), 0, 255);
          } else {
            // Ocean: deep blue with depth variation
            const depth = fbm(nx * 5 + 9, ny * 5 + 4, 4, 0.5, 2);
            r = clamp(lerp( 15,  55, depth), 0, 255);
            g = clamp(lerp( 60, 130, depth), 0, 255);
            b = clamp(lerp(160, 220, depth), 0, 255);
          }

          // Wispy cloud overlay using a separate noise layer
          const cloud = fbm(nx * 6 + 5, ny * 6 + 7, 4, 0.55, 2.3);
          const cloudMask = clamp((cloud - 0.48) * 5, 0, 1);
          r = clamp(lerp(r, 240, cloudMask * 0.7), 0, 255);
          g = clamp(lerp(g, 240, cloudMask * 0.7), 0, 255);
          b = clamp(lerp(b, 240, cloudMask * 0.7), 0, 255);

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const land = fbm(x / w * 4 + 2.3, y / h * 4 + 1.1, 6, 0.58, 2.1);
          const isLand = land > 0.525;
          const mountain = fbm(x / w * 9, y / h * 9, 5, 0.5, 2);
          const v = isLand ? clamp(mountain * 255 * 0.9, 0, 255) : 40;
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      // Oceans bright, land matte
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const land = fbm(x / w * 4 + 2.3, y / h * 4 + 1.1, 6, 0.58, 2.1);
          const isLand = land > 0.525;
          const v = isLand ? 20 : 160;
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
  },

  // ──────────────────────────────────────────────────────────────────── Mars
  mars: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        const ny  = y / h;
        const lat = (ny - 0.5) * Math.PI;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const n  = fbm(nx * 5 + 3, ny * 5 + 2, 6, 0.55, 2);

          // Rusty red base
          let r = clamp(lerp(160, 210, n), 0, 255);
          let g = clamp(lerp( 55,  90, n), 0, 255);
          let b = clamp(lerp( 30,  55, n), 0, 255);

          // Dark volcanic regions / canyon patches
          const dark = fbm(nx * 10, ny * 10, 4, 0.5, 2);
          if (dark > 0.62) {
            r = clamp(r * 0.62, 0, 255);
            g = clamp(g * 0.62, 0, 255);
            b = clamp(b * 0.62, 0, 255);
          }

          // North polar ice cap
          const abslat = Math.abs(lat);
          if (lat > 1.2) {
            const iceBlend = clamp((lat - 1.2) / 0.15, 0, 1);
            r = clamp(lerp(r, 230, iceBlend), 0, 255);
            g = clamp(lerp(g, 220, iceBlend), 0, 255);
            b = clamp(lerp(b, 210, iceBlend), 0, 255);
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 7, y / h * 7, 6, 0.55, 2.1);
          const v = clamp(n * 255, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      // Mars is mostly dry dust — very low specular
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ──────────────────────────────────────────────────────────────────── Jupiter
  jupiter: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;

      // Band palette: dark brown, cream, tan, orange, white
      const bands = [
        [130,  80,  40],   // dark brown
        [220, 190, 130],   // cream
        [180, 120,  60],   // tan
        [200, 140,  70],   // orange-tan
        [235, 210, 165],   // pale cream
        [160,  95,  50],   // deep brown
        [230, 200, 145],   // light cream
        [185, 130,  65],   // medium tan
      ];

      for (let y = 0; y < h; y++) {
        const ny = y / h;
        // Determine which band this latitude is in — clamp to avoid OOB
        const bandIdx = clamp(ny * bands.length, 0, bands.length - 0.0001);
        const b0 = bands[Math.floor(bandIdx)];
        const b1 = bands[Math.min(Math.floor(bandIdx) + 1, bands.length - 1)];
        const bf = bandIdx % 1;

        const br = lerp(b0[0], b1[0], bf);
        const bg = lerp(b0[1], b1[1], bf);
        const bb = lerp(b0[2], b1[2], bf);

        for (let x = 0; x < w; x++) {
          const nx = x / w;

          // Add horizontal turbulence to band edges
          const turb = fbm(nx * 8 + ny * 3, ny * 12, 5, 0.5, 2) * 0.3;
          // Clamp turbBandY to [0, 0.9999] so index never goes negative or OOB
          const turbBandY = clamp(ny + (turb - 0.15) * 0.06, 0, 0.9999);
          const turbBandIdx = turbBandY * bands.length;
          const tb0 = bands[Math.floor(turbBandIdx) % bands.length];
          const tb1 = bands[Math.min(Math.floor(turbBandIdx) + 1, bands.length - 1)];
          const tbf = turbBandIdx % 1;

          let r = clamp(lerp(tb0[0], tb1[0], tbf) + (fbm(nx*15, ny*15, 3, 0.5, 2) - 0.5) * 18, 0, 255);
          let g = clamp(lerp(tb0[1], tb1[1], tbf) + (fbm(nx*15+3, ny*15+3, 3, 0.5, 2) - 0.5) * 12, 0, 255);
          let b = clamp(lerp(tb0[2], tb1[2], tbf) + (fbm(nx*15+6, ny*15+6, 3, 0.5, 2) - 0.5) * 8, 0, 255);

          // Great Red Spot — centred around 23°S, ~300° longitude
          const grsX = 0.83;
          const grsY = 0.63;
          const dxGrs = (nx - grsX) * 3.0;   // stretched ellipse (wider than tall)
          const dyGrs = (ny - grsY) * 6.0;
          const grsR  = dxGrs * dxGrs + dyGrs * dyGrs;
          if (grsR < 1.0) {
            const grsBlend = clamp(1.0 - grsR, 0, 1);
            r = clamp(lerp(r, 180, grsBlend * 0.9), 0, 255);
            g = clamp(lerp(g,  65, grsBlend * 0.9), 0, 255);
            b = clamp(lerp(b,  30, grsBlend * 0.9), 0, 255);
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const ny = y / h;
          const turb = fbm(x / w * 8, ny * 12, 4, 0.5, 2);
          const v = clamp(turb * 220, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      // Gas giant — uniform low-mid specular
      ctx.fillStyle = '#2a2010';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ──────────────────────────────────────────────────────────────────── Saturn
  saturn: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      const bands = [
        [220, 195, 120],
        [200, 175, 100],
        [235, 210, 135],
        [205, 182, 108],
        [225, 200, 125],
      ];
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        const bi = clamp(ny * bands.length, 0, bands.length - 0.0001);
        const b0 = bands[Math.floor(bi)];
        const b1 = bands[Math.min(Math.floor(bi) + 1, bands.length - 1)];
        const bf = bi % 1;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const turb = fbm(nx * 6, ny * 10, 4, 0.5, 2) * 0.04;
          const tbi  = clamp((ny + turb) * bands.length, 0, bands.length - 0.0001);
          const tb0  = bands[Math.floor(tbi)];
          const tb1  = bands[Math.min(Math.floor(tbi) + 1, bands.length - 1)];
          const tbf  = tbi % 1;
          const noise = (fbm(nx * 12, ny * 12, 3, 0.5, 2) - 0.5) * 10;
          const r = clamp(lerp(tb0[0], tb1[0], tbf) + noise, 0, 255);
          const g = clamp(lerp(tb0[1], tb1[1], tbf) + noise, 0, 255);
          const b = clamp(lerp(tb0[2], tb1[2], tbf) + noise, 0, 255);
          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 6, y / h * 10, 4, 0.5, 2);
          const v = clamp(n * 180, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#1e1a0a';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ──────────────────────────────────────────────────────────────────── Uranus
  uranus: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const band = fbm(nx * 3, ny * 5, 4, 0.4, 2);
          const r = clamp(lerp(80, 125, band), 0, 255);
          const g = clamp(lerp(195, 230, band), 0, 255);
          const b = clamp(lerp(200, 235, band), 0, 255);
          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 4, y / h * 6, 3, 0.4, 2);
          const v = clamp(n * 120, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      // Icy gas — medium specular
      ctx.fillStyle = '#1a3530';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ──────────────────────────────────────────────────────────────────── Neptune
  neptune: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const n  = fbm(nx * 5 + 1, ny * 6, 5, 0.55, 2.1);

          let r = clamp(lerp( 15,  55, n), 0, 255);
          let g = clamp(lerp( 50, 110, n), 0, 255);
          let b = clamp(lerp(180, 230, n), 0, 255);

          // Bright Great Dark Spot (storm) near equator, ~200° longitude
          const dsX = 0.55;
          const dsY = 0.48;
          const dxDs = (nx - dsX) * 4;
          const dyDs = (ny - dsY) * 7;
          const dsR  = dxDs * dxDs + dyDs * dyDs;
          if (dsR < 1.0) {
            const dsBlend = clamp(1.0 - dsR, 0, 1);
            r = clamp(lerp(r, 230, dsBlend * 0.85), 0, 255);
            g = clamp(lerp(g, 240, dsBlend * 0.85), 0, 255);
            b = clamp(lerp(b, 255, dsBlend * 0.85), 0, 255);
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 6, y / h * 6, 5, 0.5, 2);
          const v = clamp(n * 200, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#0a1828';
      ctx.fillRect(0, 0, w, h);
    },
  },

};

// ─── Public API ────────────────────────────────────────────────────────────────

const TEX_W = 512;
const TEX_H = 256;

/**
 * Generate a diffuse (color) texture for the given planet id.
 * @param {string} id  e.g. 'earth', 'mars', 'jupiter'
 * @returns {THREE.CanvasTexture|null}
 */
export function generatePlanetTexture(id) {
  const p = painters[id];
  if (!p) return null;
  const { canvas, ctx, w, h } = makeCanvas(TEX_W, TEX_H);
  p.diffuse(ctx, w, h);
  return toTexture(canvas);
}

/**
 * Generate a grayscale bump map for the given planet id.
 * @param {string} id
 * @returns {THREE.CanvasTexture|null}
 */
export function generateBumpMap(id) {
  const p = painters[id];
  if (!p?.bump) return null;
  const { canvas, ctx, w, h } = makeCanvas(TEX_W, TEX_H);
  p.bump(ctx, w, h);
  return toLinearTexture(canvas);
}

/**
 * Generate a grayscale specular mask for the given planet id.
 * Bright pixels = shiny (e.g. oceans), dark = matte (land, dust).
 * @param {string} id
 * @returns {THREE.CanvasTexture|null}
 */
export function generateSpecularMap(id) {
  const p = painters[id];
  if (!p?.specular) return null;
  const { canvas, ctx, w, h } = makeCanvas(TEX_W, TEX_H);
  p.specular(ctx, w, h);
  return toLinearTexture(canvas);
}

/**
 * Generate a radial ring texture for Saturn/Uranus.
 * Bands of varying opacity and slight color variation are painted radially.
 * @param {string} hexColor  Base ring color, e.g. '#C2A45A'
 * @param {object} opts      Optional { opacity: 0.7 }
 * @returns {THREE.CanvasTexture}
 */
export function generateRingTexture(hexColor, opts = {}) {
  const W = 512;
  const H = 1;   // 1-pixel tall; UV wraps around radius so height = 1
  // We actually need a 1D texture; use 512×1
  const { canvas, ctx } = makeCanvas(W, H);

  // Parse hex colour
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const img = ctx.createImageData(W, H);
  const data = img.data;

  // Define ring lane structure: array of [start, end, opacity]
  const lanes = [
    [0.00, 0.12, 0.10],
    [0.12, 0.18, 0.60],
    [0.18, 0.28, 0.80],
    [0.28, 0.30, 0.20],
    [0.30, 0.55, 0.85],
    [0.55, 0.62, 0.30],
    [0.62, 0.80, 0.72],
    [0.80, 0.88, 0.45],
    [0.88, 1.00, 0.15],
  ];

  for (let x = 0; x < W; x++) {
    const t = x / W;  // 0 = inner edge, 1 = outer edge

    let opacity = 0;
    for (const [lo, hi, op] of lanes) {
      if (t >= lo && t < hi) { opacity = op; break; }
    }

    // Add per-pixel noise for a granular look
    const noise = (hash(x, 7) - 0.5) * 0.15;
    opacity = clamp(opacity + noise, 0, 1);

    const i = x * 4;
    data[i]     = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = Math.round(opacity * (opts.opacity ?? 0.8) * 255);
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generate a grayscale "rocky" bump texture for asteroids.
 * @returns {THREE.CanvasTexture}
 */
export function generateAsteroidBumpMap() {
  const W = 128, H = 128;
  const { canvas, ctx } = makeCanvas(W, H);
  const img = ctx.createImageData(W, H);
  const d   = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm(x / W * 8, y / H * 8, 5, 0.6, 2.2);
      const v = clamp(n * 255, 0, 255);
      setPixel(d, x, y, W, v, v, v);
    }
  }
  ctx.putImageData(img, 0, 0);
  return toLinearTexture(canvas);
}
