/**
 * textureGen.js — SOLARIS High-Fidelity Texture System
 *
 * Procedurally generates rich Three.js CanvasTextures for every planet,
 * Earth cloud layers, night city lights, moons, and rings in the solar system.
 * High-definition (1024×512) multi-octave noise synthesis with realistic
 * planetary geography, atmospheric swirls, and fine ring bands.
 */

import * as THREE from 'three';

// ─── Fast Noise Algorithms ───────────────────────────────────────────────────

function hash(x, y) {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function hash2(x, y) {
  let n = Math.sin(x * 269.5 + y * 183.3) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash(ix,     iy    );
  const b = hash(ix + 1, iy    );
  const c = hash(ix,     iy + 1);
  const d = hash(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, octaves = 6, persistence = 0.5, lacunarity = 2.0) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue  = 0;

  for (let o = 0; o < octaves; o++) {
    value     += valueNoise(x * frequency, y * frequency) * amplitude;
    maxValue  += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return value / maxValue;
}

// Domain warped fBm for organic storm swirls and continental coastlines
function warpedFbm(x, y, octaves = 5) {
  const qx = fbm(x + 0.0, y + 0.0, octaves);
  const qy = fbm(x + 5.2, y + 1.3, octaves);
  const rx = fbm(x + 4.0 * qx + 1.7, y + 4.0 * qy + 9.2, octaves);
  const ry = fbm(x + 4.0 * qx + 8.3, y + 4.0 * qy + 2.8, octaves);
  return fbm(x + 4.0 * rx, y + 4.0 * ry, octaves);
}

// ─── Canvas Utilities ────────────────────────────────────────────────────────

function makeCanvas(w = 1024, h = 512) {
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

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function toLinearTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function setPixel(data, x, y, w, r, g, b, a = 255) {
  const i = (y * w + x) * 4;
  data[i]     = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

// ─── Texture Painters ────────────────────────────────────────────────────────

const painters = {

  // ─────────────────────────────────────────────────────────────── Mercury
  mercury: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const n = fbm(nx * 8, ny * 4, 6, 0.52, 2.1);
          const fine = fbm(nx * 24, ny * 12, 4, 0.5, 2.0) * 0.2;

          // Highlands vs Basaltic Maria
          const base = lerp(110, 195, n + fine);

          // Rayed impact craters (like Caloris Basin)
          const craterSeed = hash(Math.floor(nx * 10), Math.floor(ny * 5));
          let ray = 0;
          if (craterSeed < 0.08) {
            const cx = (Math.floor(nx * 10) + 0.5) / 10;
            const cy = (Math.floor(ny * 5) + 0.5) / 5;
            const dist = Math.hypot((nx - cx) * 2, ny - cy);
            if (dist < 0.06) {
              ray = (1 - dist / 0.06) * 60;
            }
          }

          const val = clamp(base + ray, 0, 255);
          // Very subtle warm brownish tint on volcanic basalt
          const r = clamp(val * 1.02, 0, 255);
          const g = clamp(val * 0.98, 0, 255);
          const b = clamp(val * 0.94, 0, 255);
          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 10, y / h * 5, 5, 0.55, 2.2);
          const v = clamp(n * 255, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ─────────────────────────────────────────────────────────────── Venus
  venus: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          // Characteristic V-shaped planetary cloud circulation and streaks
          const latFlow = Math.sin((ny - 0.5) * Math.PI);
          const swirl = warpedFbm(nx * 4 + latFlow * 0.8, ny * 6, 5);
          const fineBands = fbm(nx * 8, ny * 16, 4, 0.5, 2.0) * 0.25;
          const v = clamp(swirl + fineBands, 0, 1);

          // Rich luminous sulfuric acid cloud palette: warm ochre → golden cream → bright ivory
          const r = clamp(lerp(215, 252, v), 0, 255);
          const g = clamp(lerp(155, 228, v), 0, 255);
          const b = clamp(lerp( 65, 135, v), 0, 255);
          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 6, y / h * 6, 4, 0.5, 2);
          const v = clamp(n * 160, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#3a321a';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ─────────────────────────────────────────────────────────────── Earth
  earth: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;

      for (let y = 0; y < h; y++) {
        const ny = y / h;
        const lat = (ny - 0.5) * Math.PI; // -pi/2 to pi/2

        for (let x = 0; x < w; x++) {
          const nx = x / w;

          // Continental landmass mask using domain warping
          const continent = warpedFbm(nx * 3.8 + 1.8, ny * 3.4 + 0.6, 6);
          const isLand = continent > 0.518;

          // Polar Ice caps
          const absLat = Math.abs(lat);
          const isIce = absLat > 1.28;
          const iceEdge = clamp((absLat - 1.22) / 0.12, 0, 1);

          let r, g, b;

          if (isIce || iceEdge > 0.6) {
            // Glacial ice & pack ice
            const iceVariation = fbm(nx * 16, ny * 16, 3) * 25;
            r = g = b = clamp(230 + iceVariation, 0, 255);
          } else if (isLand) {
            // Continental biomes based on latitude & elevation
            const elevation = (continent - 0.518) * 3.2;
            const mountainNoise = fbm(nx * 18, ny * 18, 4);

            if (elevation > 0.7 && mountainNoise > 0.6) {
              // High mountain peaks / snow
              r = clamp(lerp(140, 240, mountainNoise), 0, 255);
              g = clamp(lerp(140, 240, mountainNoise), 0, 255);
              b = clamp(lerp(130, 245, mountainNoise), 0, 255);
            } else if (absLat < 0.35 && fbm(nx * 6 + 3, ny * 6 + 2, 3) > 0.52) {
              // Sahara / desert belt (amber & warm sand)
              const sand = fbm(nx * 12, ny * 12, 3);
              r = clamp(lerp(200, 235, sand), 0, 255);
              g = clamp(lerp(160, 195, sand), 0, 255);
              b = clamp(lerp( 90, 130, sand), 0, 255);
            } else {
              // Temperate / tropical vegetation (lush deep green to olive forest)
              const veg = fbm(nx * 10, ny * 10, 4);
              r = clamp(lerp( 45,  95, veg), 0, 255);
              g = clamp(lerp( 95, 145, veg), 0, 255);
              b = clamp(lerp( 30,  60, veg), 0, 255);
            }
          } else {
            // Oceans: shallow turquoise coastal shelves fading to rich deep sapphire
            const coastDist = clamp((0.518 - continent) * 12.0, 0, 1);
            // Shallow water near shore
            const shallowR = 24, shallowG = 110, shallowB = 165;
            // Deep ocean
            const deepR = 8, deepG = 38, deepB = 92;

            r = Math.round(lerp(shallowR, deepR, coastDist));
            g = Math.round(lerp(shallowG, deepG, coastDist));
            b = Math.round(lerp(shallowB, deepB, coastDist));
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const continent = warpedFbm(x / w * 3.8 + 1.8, y / h * 3.4 + 0.6, 6);
          const isLand = continent > 0.518;
          const mountain = fbm(x / w * 16, y / h * 16, 5, 0.55, 2.0);
          const v = isLand ? clamp(mountain * 255, 60, 255) : 25;
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const continent = warpedFbm(x / w * 3.8 + 1.8, y / h * 3.4 + 0.6, 6);
          const isLand = continent > 0.518;
          // Water is highly reflective specular (210), land is dull matte (18)
          const v = isLand ? 18 : 210;
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
  },

  // ─────────────────────────────────────────────────────────────── Mars
  mars: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        const lat = (ny - 0.5) * Math.PI;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const n = fbm(nx * 6 + 1.5, ny * 6 + 0.8, 6, 0.54, 2.1);
          const canyons = warpedFbm(nx * 10, ny * 10, 4);

          // Deep rust-red iron oxide base
          let r = clamp(lerp(175, 225, n), 0, 255);
          let g = clamp(lerp( 65, 105, n), 0, 255);
          let b = clamp(lerp( 32,  58, n), 0, 255);

          // Dark volcanic basalt regions (Syrtis Major, Acidalia Planitia)
          const darkBasalt = fbm(nx * 7 + 4, ny * 7 + 2, 4);
          if (darkBasalt > 0.58) {
            const factor = clamp((darkBasalt - 0.58) * 2.2, 0, 0.65);
            r = clamp(lerp(r, 85, factor), 0, 255);
            g = clamp(lerp(g, 42, factor), 0, 255);
            b = clamp(lerp(b, 28, factor), 0, 255);
          }

          // Valles Marineris canyon scar
          if (Math.abs(ny - 0.54) < 0.03 && nx > 0.35 && nx < 0.65) {
            const canyonDepth = (1 - Math.abs(ny - 0.54) / 0.03) * (canyons > 0.4 ? 0.7 : 0.2);
            r *= (1 - canyonDepth * 0.55);
            g *= (1 - canyonDepth * 0.55);
            b *= (1 - canyonDepth * 0.55);
          }

          // Olympus Mons shield volcano
          const dxOm = (nx - 0.28) * 4.0;
          const dyOm = (ny - 0.46) * 8.0;
          const omDist = dxOm * dxOm + dyOm * dyOm;
          if (omDist < 0.25) {
            const omGlow = (1 - omDist / 0.25);
            r = clamp(r + omGlow * 35, 0, 255);
            g = clamp(g + omGlow * 20, 0, 255);
          }

          // Sparkling Polar Ice Caps (CO2 + H2O ice)
          const absLat = Math.abs(lat);
          if (absLat > 1.24) {
            const iceBlend = clamp((absLat - 1.24) / 0.14, 0, 1);
            r = clamp(lerp(r, 245, iceBlend), 0, 255);
            g = clamp(lerp(g, 240, iceBlend), 0, 255);
            b = clamp(lerp(b, 235, iceBlend), 0, 255);
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 8, y / h * 8, 5, 0.55, 2.1);
          const v = clamp(n * 255, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#0f0a06';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ─────────────────────────────────────────────────────────────── Jupiter
  jupiter: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;

      // Authentic Jovian color palette for belts & zones
      const bands = [
        [125,  75,  38], // South Polar Dark Belt
        [210, 175, 125], // South Temperate Zone
        [155,  92,  52], // South Temperate Belt
        [235, 210, 165], // South Tropical Zone (creamy white)
        [175,  85,  40], // South Equatorial Belt (deep reddish brown)
        [240, 222, 185], // Equatorial Zone (bright warm cream)
        [180,  95,  45], // North Equatorial Belt
        [225, 195, 145], // North Tropical Zone
        [145,  88,  48], // North Temperate Belt
        [120,  70,  35], // North Polar Dark Belt
      ];

      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;

          // Atmospheric jet stream turbulence and shearing eddies
          const turbulence = warpedFbm(nx * 8 + ny * 2, ny * 14, 5) * 0.08;
          const bandY = clamp(ny + turbulence, 0, 0.9999);

          const bandIdx = bandY * bands.length;
          const b0 = bands[Math.floor(bandIdx)];
          const b1 = bands[Math.min(Math.floor(bandIdx) + 1, bands.length - 1)];
          const bf = bandIdx % 1;

          // Fine cloud filaments and micro-storms
          const microStorm = (fbm(nx * 28, ny * 28, 3) - 0.5) * 24;

          let r = clamp(lerp(b0[0], b1[0], bf) + microStorm, 0, 255);
          let g = clamp(lerp(b0[1], b1[1], bf) + microStorm * 0.8, 0, 255);
          let b = clamp(lerp(b0[2], b1[2], bf) + microStorm * 0.6, 0, 255);

          // Great Red Spot (centred at ~22° S, lat ~0.62)
          const grsX = 0.68;
          const grsY = 0.61;
          const dxGrs = (nx - grsX) * 4.5;
          const dyGrs = (ny - grsY) * 9.0;
          const grsDist = dxGrs * dxGrs + dyGrs * dyGrs;

          if (grsDist < 1.0) {
            // Swirling counter-clockwise internal vortex
            const angle = Math.atan2(dyGrs, dxGrs);
            const vortexSwirl = Math.sin(angle * 3 + (1 - grsDist) * 8) * 0.15;
            const grsBlend = clamp(1.0 - grsDist + vortexSwirl, 0, 1);

            // Vivid crimson-terracotta eye with bright outer halo
            r = clamp(lerp(r, 218, grsBlend), 0, 255);
            g = clamp(lerp(g,  72, grsBlend), 0, 255);
            b = clamp(lerp(b,  38, grsBlend), 0, 255);
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const turb = fbm(x / w * 12, y / h * 18, 4, 0.5, 2);
          const v = clamp(turb * 210, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#241b0f';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ─────────────────────────────────────────────────────────────── Saturn
  saturn: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;

      const bands = [
        [195, 175, 120],
        [228, 210, 155],
        [212, 192, 135],
        [242, 226, 175],
        [218, 200, 142],
        [235, 218, 160],
        [185, 168, 115],
      ];

      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const turb = fbm(nx * 6, ny * 12, 4) * 0.035;
          const bandY = clamp(ny + turb, 0, 0.9999);
          const bIdx = bandY * bands.length;
          const b0 = bands[Math.floor(bIdx)];
          const b1 = bands[Math.min(Math.floor(bIdx) + 1, bands.length - 1)];
          const bf = bIdx % 1;

          const grain = (fbm(nx * 20, ny * 20, 3) - 0.5) * 12;

          let r = clamp(lerp(b0[0], b1[0], bf) + grain, 0, 255);
          let g = clamp(lerp(b0[1], b1[1], bf) + grain * 0.95, 0, 255);
          let b = clamp(lerp(b0[2], b1[2], bf) + grain * 0.75, 0, 255);

          // North Polar Hexagon feature (lat > 0.88)
          if (ny < 0.12) {
            const angle = Math.atan2(ny - 0.06, nx - 0.5);
            const hex = Math.cos(angle * 6) * 0.02;
            if (Math.hypot(nx - 0.5, (ny - 0.06) * 2) < 0.08 + hex) {
              r = clamp(r * 0.85, 0, 255);
              g = clamp(g * 0.88, 0, 255);
              b = clamp(b * 0.92, 0, 255); // cool bluish-gold tint at pole
            }
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 6, y / h * 12, 3);
          const v = clamp(n * 160, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#201c10';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ─────────────────────────────────────────────────────────────── Uranus
  uranus: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const band = fbm(nx * 3, ny * 6, 4, 0.4, 2);
          // Ethereal pale cyan-aquamarine with subtle polar darkening
          const poleDim = 1 - Math.abs(ny - 0.5) * 0.25;
          const r = clamp(lerp(105, 145, band) * poleDim, 0, 255);
          const g = clamp(lerp(210, 242, band) * poleDim, 0, 255);
          const b = clamp(lerp(215, 248, band) * poleDim, 0, 255);
          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 4, y / h * 6, 3);
          const v = clamp(n * 110, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#1c3632';
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ─────────────────────────────────────────────────────────────── Neptune
  neptune: {
    diffuse(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const flow = warpedFbm(nx * 5 + 1.2, ny * 6 + 0.4, 5);

          // Deep azure/cobalt blue with methane absorption depths
          let r = clamp(lerp( 22,  68, flow), 0, 255);
          let g = clamp(lerp( 65, 135, flow), 0, 255);
          let b = clamp(lerp(195, 252, flow), 0, 255);

          // Great Dark Spot (deep tempest storm vortex)
          const dsX = 0.52;
          const dsY = 0.46;
          const dxDs = (nx - dsX) * 4.2;
          const dyDs = (ny - dsY) * 8.0;
          const dsDist = dxDs * dxDs + dyDs * dyDs;
          if (dsDist < 1.0) {
            const dsGlow = 1.0 - dsDist;
            r = clamp(lerp(r,  10, dsGlow * 0.8), 0, 255);
            g = clamp(lerp(g,  30, dsGlow * 0.8), 0, 255);
            b = clamp(lerp(b, 130, dsGlow * 0.8), 0, 255);
          }

          // High-altitude brilliant white methane cirrus cloud streaks
          const cirrus = fbm(nx * 14 + 8, ny * 18 + 4, 4);
          if (cirrus > 0.65 && (Math.abs(ny - 0.42) < 0.08 || Math.abs(ny - 0.58) < 0.06)) {
            const cloudBlend = clamp((cirrus - 0.65) * 3.5, 0, 0.9);
            r = clamp(lerp(r, 250, cloudBlend), 0, 255);
            g = clamp(lerp(g, 252, cloudBlend), 0, 255);
            b = clamp(lerp(b, 255, cloudBlend), 0, 255);
          }

          setPixel(d, x, y, w, r, g, b);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    bump(ctx, w, h) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = fbm(x / w * 6, y / h * 6, 4);
          const v = clamp(n * 180, 0, 255);
          setPixel(d, x, y, w, v, v, v);
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    specular(ctx, w, h) {
      ctx.fillStyle = '#0e223c';
      ctx.fillRect(0, 0, w, h);
    },
  },
};

// ─── Specialized Additional Textures ─────────────────────────────────────────

/**
 * Generate an Earth cloud map with transparent background and realistic fluffy cumulus/cirrus swirls.
 */
export function generateEarthCloudsTexture() {
  const { canvas, ctx, w, h } = makeCanvas(1024, 512);
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      // Coriolis-effect curving clouds with domain warp
      const cloudNoise = warpedFbm(nx * 5.5 + ny * 2.0, ny * 5.5, 5);
      const density = clamp((cloudNoise - 0.44) * 2.8, 0, 1);

      if (density > 0) {
        const alpha = Math.round(density * 225);
        const shade = Math.round(lerp(220, 255, cloudNoise));
        setPixel(d, x, y, w, shade, shade, shade, alpha);
      } else {
        setPixel(d, x, y, w, 0, 0, 0, 0);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generate Earth night-side glowing golden city clusters.
 */
export function generateEarthNightLightsTexture() {
  const { canvas, ctx, w, h } = makeCanvas(1024, 512);
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const continent = warpedFbm(nx * 3.8 + 1.8, ny * 3.4 + 0.6, 6);
      const isLand = continent > 0.525;

      if (isLand) {
        // High density along coasts and river basins
        const citySeed = hash(Math.floor(nx * 80), Math.floor(ny * 40));
        const fineCluster = hash2(Math.floor(nx * 200), Math.floor(ny * 100));

        if (citySeed > 0.72 && fineCluster > 0.4) {
          const intensity = Math.round((citySeed - 0.72) / 0.28 * 255);
          // Golden/amber incandescent city light glow
          setPixel(d, x, y, w, intensity, Math.round(intensity * 0.8), Math.round(intensity * 0.4), 255);
          continue;
        }
      }
      setPixel(d, x, y, w, 0, 0, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Procedural texture for major moons (Luna, Io, Europa, Titan, Ganymede, etc.)
 */
export function generateMoonTexture(moonId = 'luna') {
  const { canvas, ctx, w, h } = makeCanvas(512, 256);
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const n = fbm(nx * 8, ny * 4, 5);

      if (moonId === 'io') {
        // Volcanic sulfur yellow, fiery orange, black calderas
        const r = clamp(lerp(210, 255, n), 0, 255);
        const g = clamp(lerp(140, 220, n), 0, 255);
        const b = clamp(lerp( 20,  70, n), 0, 255);
        setPixel(d, x, y, w, r, g, b);
      } else if (moonId === 'europa') {
        // Cracked ice crust, pale ivory with brownish-red tectonic lineae fractures
        const crack = fbm(nx * 25, ny * 25, 4);
        let r = clamp(lerp(215, 245, n), 0, 255);
        let g = clamp(lerp(220, 248, n), 0, 255);
        let b = clamp(lerp(225, 255, n), 0, 255);
        if (crack > 0.68) {
          r = clamp(r * 0.72, 0, 255);
          g = clamp(g * 0.65, 0, 255);
          b = clamp(b * 0.55, 0, 255);
        }
        setPixel(d, x, y, w, r, g, b);
      } else if (moonId === 'titan') {
        // Thick dense hazy orange nitrogen/methane smog
        const r = clamp(lerp(210, 245, n), 0, 255);
        const g = clamp(lerp(120, 165, n), 0, 255);
        const b = clamp(lerp( 40,  85, n), 0, 255);
        setPixel(d, x, y, w, r, g, b);
      } else {
        // Default lunar cratered grey surface (Luna, Ganymede, Callisto, Phobos)
        const v = clamp(lerp(120, 195, n), 0, 255);
        setPixel(d, x, y, w, v, v, v);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generatePlanetTexture(id) {
  const p = painters[id];
  if (!p) return null;
  const { canvas, ctx, w, h } = makeCanvas(1024, 512);
  p.diffuse(ctx, w, h);
  return toTexture(canvas);
}

export function generateBumpMap(id) {
  const p = painters[id];
  if (!p?.bump) return null;
  const { canvas, ctx, w, h } = makeCanvas(1024, 512);
  p.bump(ctx, w, h);
  return toLinearTexture(canvas);
}

export function generateSpecularMap(id) {
  const p = painters[id];
  if (!p?.specular) return null;
  const { canvas, ctx, w, h } = makeCanvas(1024, 512);
  p.specular(ctx, w, h);
  return toLinearTexture(canvas);
}

export function generateRingTexture(hexColor, opts = {}) {
  const W = 1024;
  const H = 1;
  const { canvas, ctx } = makeCanvas(W, H);

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const img = ctx.createImageData(W, H);
  const data = img.data;

  // Realistic Saturn Ring System with Cassini Division & Encke Gap:
  // [startFraction, endFraction, opacity, colorTintScale]
  const lanes = [
    [0.00, 0.10, 0.08, 0.85],  // D Ring (very faint)
    [0.10, 0.32, 0.45, 0.90],  // C Ring (Crepe ring)
    [0.32, 0.35, 0.15, 0.80],  // Colombo Gap
    [0.35, 0.65, 0.92, 1.05],  // B Ring (brightest, densest)
    [0.65, 0.72, 0.02, 0.40],  // Cassini Division (dark gap)
    [0.72, 0.88, 0.78, 1.00],  // A Ring
    [0.88, 0.91, 0.05, 0.50],  // Encke Gap
    [0.91, 0.96, 0.50, 0.95],  // Outer A Ring
    [0.96, 1.00, 0.25, 0.90],  // F Ring
  ];

  for (let x = 0; x < W; x++) {
    const t = x / W;
    let opacity = 0;
    let tint = 1.0;

    for (const [lo, hi, op, tScale] of lanes) {
      if (t >= lo && t < hi) {
        opacity = op;
        tint = tScale;
        break;
      }
    }

    // Micro-banding noise across thousands of ice ringlets
    const ringlet = (hash(x, 11) - 0.5) * 0.18;
    opacity = clamp(opacity + ringlet, 0, 1);

    const i = x * 4;
    data[i]     = clamp(Math.round(r * tint), 0, 255);
    data[i + 1] = clamp(Math.round(g * tint), 0, 255);
    data[i + 2] = clamp(Math.round(b * tint), 0, 255);
    data[i + 3] = Math.round(opacity * (opts.opacity ?? 0.85) * 255);
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function generateAsteroidBumpMap() {
  const W = 256, H = 256;
  const { canvas, ctx } = makeCanvas(W, H);
  const img = ctx.createImageData(W, H);
  const d = img.data;
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
