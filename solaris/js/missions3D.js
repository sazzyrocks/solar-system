/**
 * missions3D.js — Real-Time 3D Spacecraft Missions & Trajectories
 * Inspired by NASA's "Eyes on the Solar System"
 *
 * Implements real-time 3D spacecraft:
 *   • Voyager 1 & Voyager 2 (Interstellar Space)
 *   • Pioneer 10 & Pioneer 11 (Outer Solar System)
 *   • New Horizons (Kuiper Belt)
 *   • James Webb Space Telescope (Sun-Earth L2)
 *   • Parker Solar Probe (Perihelion Solar Dive)
 *   • Cassini-Huygens (Saturn)
 *   • Artemis II (Lunar Flyby)
 *   • International Space Station & Hubble (Earth Orbit)
 */

import * as THREE from 'three';

// Reusable scratch vector to eliminate per-frame allocations in orbiter positions
const _scratchPos = new THREE.Vector3();

// ─── Procedural 3D Spacecraft Meshes ─────────────────────────────────────────

function createGoldMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xE5A93C,
    metalness: 0.85,
    roughness: 0.25,
  });
}

function createWhiteMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xF0F4F8,
    metalness: 0.2,
    roughness: 0.4,
  });
}

function createSolarPanelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x1A2B4C,
    metalness: 0.7,
    roughness: 0.15,
  });
}

/**
 * 3D Voyager probe model: high-gain white dish antenna, gold bus, sensor boom & RTG.
 */
function createVoyagerMesh() {
  const group = new THREE.Group();

  // White parabolic high-gain dish antenna (3.7 m diameter in real life)
  const dishGeo = new THREE.CylinderGeometry(1.2, 0.2, 0.35, 32, 1, true);
  const dishMat = createWhiteMaterial();
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.rotation.x = Math.PI / 2;
  group.add(dish);

  // Subreflector tripod feed
  const feedGeo = new THREE.ConeGeometry(0.15, 0.45, 16);
  const feedMat = createWhiteMaterial();
  const feed = new THREE.Mesh(feedGeo, feedMat);
  feed.position.z = 0.4;
  feed.rotation.x = -Math.PI / 2;
  group.add(feed);

  // 10-sided gold foil equipment bus
  const busGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 10);
  const busMat = createGoldMaterial();
  const bus = new THREE.Mesh(busGeo, busMat);
  bus.position.z = -0.3;
  group.add(bus);

  // Magnetometer boom truss
  const magGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
  const magMat = createWhiteMaterial();
  const mag = new THREE.Mesh(magGeo, magMat);
  mag.position.set(0.9, 0.3, -0.4);
  mag.rotation.z = Math.PI / 3;
  group.add(mag);

  // Radioisotope Thermoelectric Generator (RTG) boom
  const rtgTrussGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8);
  const rtgTruss = new THREE.Mesh(rtgTrussGeo, magMat);
  rtgTruss.position.set(-0.7, -0.2, -0.4);
  rtgTruss.rotation.z = -Math.PI / 3;
  group.add(rtgTruss);

  const rtgCanGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.6, 12);
  const rtgCanMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.3 });
  const rtg = new THREE.Mesh(rtgCanGeo, rtgCanMat);
  rtg.position.set(-1.2, -0.4, -0.4);
  group.add(rtg);

  group.scale.setScalar(0.7);
  return group;
}

/**
 * 3D James Webb Space Telescope model: 5-layer kite sunshield + golden hexagonal primary mirror.
 */
function createWebbMesh() {
  const group = new THREE.Group();

  // Layered silver/pinkish kite sunshield
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 1.8);
  shieldShape.lineTo(0.9, 0.2);
  shieldShape.lineTo(0.7, -1.8);
  shieldShape.lineTo(-0.7, -1.8);
  shieldShape.lineTo(-0.9, 0.2);
  shieldShape.closePath();

  const shieldGeo = new THREE.ShapeGeometry(shieldShape);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xD8A8C0,
    metalness: 0.9,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.rotation.x = Math.PI / 2;
  group.add(shield);

  // Spacecraft bus & solar array underneath
  const busGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
  const busMat = createGoldMaterial();
  const bus = new THREE.Mesh(busGeo, busMat);
  bus.position.y = -0.25;
  group.add(bus);

  const solarGeo = new THREE.BoxGeometry(0.8, 0.02, 0.4);
  const solar = new THREE.Mesh(solarGeo, createSolarPanelMaterial());
  solar.position.set(0, -0.3, -1.2);
  group.add(solar);

  // Golden Primary Mirror (hexagonal cluster)
  const mirrorGroup = new THREE.Group();
  mirrorGroup.position.set(0, 0.35, 0.1);

  const mirrorGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.04, 6);
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xF7CA35,
    metalness: 0.98,
    roughness: 0.08,
  });
  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.rotation.x = Math.PI / 2;
  mirrorGroup.add(mirror);

  // Secondary mirror tripod
  const tripodMat = createWhiteMaterial();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6);
    const leg = new THREE.Mesh(legGeo, tripodMat);
    leg.position.set(Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0.4);
    leg.rotation.x = Math.PI / 2;
    mirrorGroup.add(leg);
  }

  const secMirrorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 6);
  const secMirror = new THREE.Mesh(secMirrorGeo, mirrorMat);
  secMirror.position.z = 0.8;
  secMirror.rotation.x = Math.PI / 2;
  mirrorGroup.add(secMirror);

  group.add(mirrorGroup);
  group.scale.setScalar(0.75);
  return group;
}

/**
 * 3D Cassini probe model: golden cylindrical body + white high-gain dish + Huygens probe.
 */
function createCassiniMesh() {
  const group = new THREE.Group();

  // White high-gain dish antenna
  const dishGeo = new THREE.CylinderGeometry(0.9, 0.15, 0.25, 24, 1, true);
  const dish = new THREE.Mesh(dishGeo, createWhiteMaterial());
  dish.rotation.x = Math.PI / 2;
  group.add(dish);

  // Cylindrical body wrapped in golden Mylar insulation
  const bodyGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.9, 16);
  const body = new THREE.Mesh(bodyGeo, createGoldMaterial());
  body.position.z = -0.55;
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Huygens Titan descent probe attached to the side
  const huygensGeo = new THREE.ConeGeometry(0.35, 0.25, 16);
  const huygensMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.8, roughness: 0.3 });
  const huygens = new THREE.Mesh(huygensGeo, huygensMat);
  huygens.position.set(0.5, 0, -0.5);
  huygens.rotation.z = -Math.PI / 2;
  group.add(huygens);

  group.scale.setScalar(0.7);
  return group;
}

/**
 * 3D Parker Solar Probe model: white carbon-composite heat shield & swept solar wings.
 */
function createParkerMesh() {
  const group = new THREE.Group();

  // Thermal Protection System (heat shield)
  const shieldGeo = new THREE.BoxGeometry(1.4, 1.1, 0.1);
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.3 });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  group.add(shield);

  // Spacecraft bus behind shield
  const busGeo = new THREE.BoxGeometry(0.5, 0.5, 0.7);
  const bus = new THREE.Mesh(busGeo, createGoldMaterial());
  bus.position.z = -0.4;
  group.add(bus);

  // Solar array wings
  const wingGeo = new THREE.BoxGeometry(1.6, 0.35, 0.03);
  const wing = new THREE.Mesh(wingGeo, createSolarPanelMaterial());
  wing.position.set(0, 0, -0.6);
  group.add(wing);

  group.scale.setScalar(0.65);
  return group;
}

/**
 * 3D Artemis Orion Capsule & European Service Module.
 */
function createArtemisMesh() {
  const group = new THREE.Group();

  // Orion Crew Module (cone)
  const capsuleGeo = new THREE.ConeGeometry(0.5, 0.45, 18);
  const capsuleMat = createWhiteMaterial();
  const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
  capsule.rotation.x = Math.PI / 2;
  group.add(capsule);

  // Service Module (cylinder)
  const serviceGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.5, 18);
  const service = new THREE.Mesh(serviceGeo, createWhiteMaterial());
  service.position.z = -0.45;
  service.rotation.x = Math.PI / 2;
  group.add(service);

  // 4 X-wing solar panels
  const panelGeo = new THREE.BoxGeometry(0.9, 0.18, 0.02);
  const panelMat = createSolarPanelMaterial();
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(panelGeo, panelMat);
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    p.position.set(Math.cos(ang) * 0.9, Math.sin(ang) * 0.9, -0.5);
    p.rotation.z = ang;
    group.add(p);
  }

  group.scale.setScalar(0.7);
  return group;
}

// ─── Mission Trajectory Lines ────────────────────────────────────────────────

function createTrajectoryLine(points, color = 0x4A9EFF, opacity = 0.65) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  return new THREE.Line(geo, mat);
}

// ─── Missions Catalogue ──────────────────────────────────────────────────────

export const MISSIONS_CATALOGUE = [
  {
    id: 'voyager1',
    name: 'Voyager 1',
    category: 'Interstellar Space',
    status: 'Active · Interstellar Mission',
    launched: 1977,
    distanceAU: 164.2,
    speedKmS: 16.9,
    description: "Humanity's farthest spacecraft. Launched in 1977, Voyager 1 explored Jupiter and Saturn before crossing the heliopause into interstellar space in August 2012.",
    color: '#00D4FF',
    meshType: 'voyager',
    // Trajectory parametric configuration
    trajectoryType: 'hyperbolic',
    startRadius: 30,
    endRadius: 185,
    angle: 0.95,
    inclination: 0.55,
    currentProgress: 0.92,
  },
  {
    id: 'voyager2',
    name: 'Voyager 2',
    category: 'Interstellar Space',
    status: 'Active · Interstellar Mission',
    launched: 1977,
    distanceAU: 137.5,
    speedKmS: 15.3,
    description: "The only spacecraft to visit all four giant planets: Jupiter, Saturn, Uranus, and Neptune. Currently exploring interstellar space beyond the solar wind boundary.",
    color: '#38BDF8',
    meshType: 'voyager',
    trajectoryType: 'hyperbolic',
    startRadius: 30,
    endRadius: 165,
    angle: 3.4,
    inclination: -0.62,
    currentProgress: 0.86,
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope',
    category: 'Deep Space Observatory',
    status: 'Active · Sun-Earth L2 Orbit',
    launched: 2021,
    distanceAU: 1.01,
    speedKmS: 0.25,
    description: "NASA's premier astrophysics observatory. Operating at the Sun-Earth L2 Lagrange point, capturing the earliest galaxies and exoplanet atmospheres in infrared.",
    color: '#F59E0B',
    meshType: 'webb',
    trajectoryType: 'lagrange_l2',
    parentPlanet: 'earth',
    orbitRadius: 32.5,
    l2Offset: 3.2,
    currentProgress: 0.5,
  },
  {
    id: 'parker',
    name: 'Parker Solar Probe',
    category: 'Solar Science',
    status: 'Active · Touching the Sun',
    launched: 2018,
    distanceAU: 0.08,
    speedKmS: 176.0,
    description: "The fastest human-made object ever built. Dives through the Sun's blazing outer corona to unravel the mysteries of solar wind heating and coronal mass ejections.",
    color: '#EF4444',
    meshType: 'parker',
    trajectoryType: 'solar_dive',
    perihelion: 6.5,
    aphelion: 35.0,
    currentProgress: 0.72,
  },
  {
    id: 'cassini',
    name: 'Cassini-Huygens',
    category: 'Saturn Exploration',
    status: 'Completed · Grand Finale',
    launched: 1997,
    distanceAU: 9.58,
    speedKmS: 34.0,
    description: "Orbits Saturn for 13 years, discovering subsurface oceans on Enceladus, methane lakes on Titan, and concluding with a historic plunge into Saturn's atmosphere.",
    color: '#EAB308',
    meshType: 'cassini',
    trajectoryType: 'planet_polar',
    parentPlanet: 'saturn',
    orbitRadius: 84,
    dist: 5.5,
  },
  {
    id: 'newhorizons',
    name: 'New Horizons',
    category: 'Kuiper Belt',
    status: 'Active · Kuiper Belt',
    launched: 2006,
    distanceAU: 59.4,
    speedKmS: 13.8,
    description: "First mission to explore Pluto and its moons up close, revealing nitrogen glaciers and mountains of water ice, then continuing to contact binary Arrokoth.",
    color: '#A855F7',
    meshType: 'voyager',
    trajectoryType: 'hyperbolic',
    startRadius: 30,
    endRadius: 140,
    angle: 2.1,
    inclination: 0.12,
    currentProgress: 0.75,
  },
  {
    id: 'artemis2',
    name: 'Artemis II',
    category: 'Human Lunar Mission',
    status: 'Scheduled · Lunar Flyby',
    launched: 2026,
    distanceAU: 1.002,
    speedKmS: 10.8,
    description: "First crewed mission of the Artemis program, sending four astronauts on a 10-day translunar trajectory looping around the Moon and returning to Earth.",
    color: '#10B981',
    meshType: 'artemis',
    trajectoryType: 'lunar_loop',
    parentPlanet: 'earth',
    orbitRadius: 30,
    dist: 2.8,
  },
  {
    id: 'pioneer10',
    name: 'Pioneer 10',
    category: 'Interstellar Space',
    status: 'Silent Pioneer · Deep Space',
    launched: 1972,
    distanceAU: 135.0,
    speedKmS: 11.9,
    description: "The first spacecraft to traverse the asteroid belt and achieve a direct flyby of Jupiter. Carried the iconic golden plaque for extraterrestrial civilizations.",
    color: '#64748B',
    meshType: 'voyager',
    trajectoryType: 'hyperbolic',
    startRadius: 30,
    endRadius: 155,
    angle: 4.8,
    inclination: 0.30,
    currentProgress: 0.88,
  },
];

// ─── 3D Missions Manager Class ────────────────────────────────────────────────

export class Missions3DManager {
  /**
   * @param {THREE.Scene} scene
   * @param {PlanetManager} planetManager
   */
  constructor(scene, planetManager) {
    this._scene         = scene;
    this._planetManager = planetManager;
    this._spacecraft    = [];

    this._buildMissions();
  }

  _buildMissions() {
    MISSIONS_CATALOGUE.forEach((data) => {
      const group = new THREE.Group();
      group.name  = `spacecraft-${data.id}`;

      // Build specific 3D model
      let model;
      if (data.meshType === 'webb')        model = createWebbMesh();
      else if (data.meshType === 'cassini') model = createCassiniMesh();
      else if (data.meshType === 'parker')  model = createParkerMesh();
      else if (data.meshType === 'artemis') model = createArtemisMesh();
      else                                  model = createVoyagerMesh();

      group.add(model);

      // Trajectory path & calculation
      const { pathPoints, initialPos } = this._computeTrajectory(data);
      group.position.copy(initialPos);

      // Trajectory Line
      let trajectoryLine = null;
      if (pathPoints && pathPoints.length > 1) {
        trajectoryLine = createTrajectoryLine(pathPoints, new THREE.Color(data.color), 0.45);
        this._scene.add(trajectoryLine);
      }

      // Target Beacon Ring (NASA Eyes hexagonal / circular beacon)
      const beaconGeo = new THREE.RingGeometry(0.7, 0.9, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(data.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.name = `beacon-${data.id}`;
      group.add(beacon);

      this._scene.add(group);

      this._spacecraft.push({
        data,
        group,
        model,
        beacon,
        trajectoryLine,
        pathPoints,
        progress: data.currentProgress ?? 0.5,
      });
    });
  }

  _computeTrajectory(data) {
    const points = [];
    const initialPos = new THREE.Vector3();

    if (data.trajectoryType === 'hyperbolic') {
      const SEGMENTS = 64;
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const r = THREE.MathUtils.lerp(data.startRadius, data.endRadius, t);
        const a = data.angle + t * 0.4;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const y = t * data.endRadius * data.inclination * 0.4;
        points.push(new THREE.Vector3(x, y, z));
      }
      // Current position along path
      const idx = Math.floor(data.currentProgress * SEGMENTS);
      initialPos.copy(points[idx] || points[0]);
    } else if (data.trajectoryType === 'solar_dive') {
      const SEGMENTS = 80;
      const a = (data.aphelion + data.perihelion) / 2;
      const e = (data.aphelion - data.perihelion) / (data.aphelion + data.perihelion);
      for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * Math.PI * 2;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
        const x = Math.cos(theta + 0.8) * r;
        const z = Math.sin(theta + 0.8) * r;
        const y = Math.sin(theta) * 3.5;
        points.push(new THREE.Vector3(x, y, z));
      }
      initialPos.copy(points[Math.floor(data.currentProgress * SEGMENTS)]);
    } else if (data.trajectoryType === 'lagrange_l2') {
      // Earth-Moon-Sun L2 halo orbit (slightly outside Earth)
      const SEGMENTS = 48;
      for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * Math.PI * 2;
        const x = Math.cos(theta) * (data.orbitRadius + data.l2Offset);
        const z = Math.sin(theta) * (data.orbitRadius + data.l2Offset);
        points.push(new THREE.Vector3(x, 0, z));
      }
      initialPos.copy(points[0]);
    } else {
      // Planetary orbiters (Cassini, Artemis)
      const SEGMENTS = 48;
      const r = data.orbitRadius + (data.dist || 4);
      for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * 2.0, Math.sin(theta) * r));
      }
      initialPos.copy(points[0]);
    }

    return { pathPoints: points, initialPos };
  }

  // ─── Per-Frame Update ─────────────────────────────────────────────────────────

  update(deltaSimDays, camera) {
    this._spacecraft.forEach((sc) => {
      // Slow drift / motion
      if (sc.data.trajectoryType === 'hyperbolic') {
        sc.progress = (sc.progress + deltaSimDays * 0.0001) % 1.0;
        if (sc.pathPoints && sc.pathPoints.length > 1) {
          const idx = Math.min(Math.floor(sc.progress * (sc.pathPoints.length - 1)), sc.pathPoints.length - 1);
          sc.group.position.copy(sc.pathPoints[idx]);
        }
      } else if (sc.data.trajectoryType === 'solar_dive') {
        sc.progress = (sc.progress + deltaSimDays * 0.005) % 1.0;
        const idx = Math.floor(sc.progress * (sc.pathPoints.length - 1));
        sc.group.position.copy(sc.pathPoints[idx]);
      } else if (sc.data.parentPlanet) {
        // Orbiters lock with parent planet position
        const pObj = this._planetManager.getPlanetObject(sc.data.parentPlanet);
        if (pObj) {
          pObj.group.getWorldPosition(_scratchPos);

          sc.progress = (sc.progress + deltaSimDays * 0.05) % (Math.PI * 2);
          const d = sc.data.dist || 4.5;
          sc.group.position.set(
            _scratchPos.x + Math.cos(sc.progress) * d,
            _scratchPos.y + Math.sin(sc.progress * 1.5) * (d * 0.4),
            _scratchPos.z + Math.sin(sc.progress) * d
          );
        }
      }

      // Orient beacon to always face the active camera (billboarding)
      if (camera && sc.beacon) {
        sc.beacon.quaternion.copy(camera.quaternion);
      }

      // Slow self-rotation of probe
      if (sc.model) {
        sc.model.rotation.y += deltaSimDays * 0.02;
      }
    });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  getSpacecraftList() {
    return this._spacecraft;
  }

  getSpacecraft(id) {
    return this._spacecraft.find(s => s.data.id === id) ?? null;
  }

  getSpacecraftWorldPosition(id) {
    const sc = this.getSpacecraft(id);
    if (!sc) return null;
    const wp = new THREE.Vector3();
    sc.group.getWorldPosition(wp);
    return wp;
  }

  setTrajectoriesVisible(visible) {
    this._trajectoriesVisible = visible;
    this._spacecraft.forEach(sc => {
      if (sc.trajectoryLine) sc.trajectoryLine.visible = visible;
    });
  }

  toggleTrajectories() {
    const next = !(this._trajectoriesVisible ?? true);
    this.setTrajectoriesVisible(next);
    return next;
  }
}

