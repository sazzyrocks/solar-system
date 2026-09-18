/**
 * app.js — SOLARIS entry point (NASA Eyes Interactive Experience)
 * Boots all modules:
 *   • Three.js scene, camera, lighting, bloom
 *   • Planets with procedural 1024x512 textures, Earth clouds, moons, Sun granulation
 *   • Real-time 3D Spacecraft Missions (Voyager 1/2, JWST, Cassini, Parker Solar Probe, Artemis II)
 *   • Screen-projected 3D floating labels
 *   • Main Asteroid Belt + Jupiter L4/L5 Trojan Asteroid swarms
 *   • NASA Eyes Left Drawer & Live time machine
 *   • AI Assistant & Audio ambience
 */

import * as THREE             from 'three';
import { SolarSystem }        from './js/solarSystem.js';
import { CameraController }   from './js/camera.js';
import { PlanetManager }      from './js/planets.js';
import { Missions3DManager }  from './js/missions3D.js';
import { Labels3DManager }    from './js/labels3D.js';
import { UIManager }          from './js/ui.js';
import { InteractionManager } from './js/interactions.js';
import { AsteroidBelt }       from './js/asteroidBelt.js';
import { AudioManager }       from './js/audio.js';
import { AIAssistant }        from './js/assistant.js';

const FALLBACK_PLANET_DATA = {
  sun: { name: "Sun", diameter: 1392700, temperature: 5505, atmosphere: ["Hydrogen", "Helium"], color: "#FDB813", glowColor: "#FF6000", size: 4.5 },
  planets: [
    { id: "mercury", name: "Mercury", diameter: 4879, dayLength: 1407.6, yearLength: 87.97, moons: 0, distanceFromSun: 57.9, temperature: 167, atmosphere: ["Oxygen", "Sodium"], color: "#9E9E9E", size: 0.45, orbitRadius: 14, orbitSpeed: 0.47, rotationSpeed: 0.08, shininess: 60, tilt: 0.03 },
    { id: "venus", name: "Venus", diameter: 12104, dayLength: 5832.5, yearLength: 224.7, moons: 0, distanceFromSun: 108.2, temperature: 464, atmosphere: ["Carbon Dioxide"], color: "#E8C07D", size: 0.95, orbitRadius: 22, orbitSpeed: 0.35, rotationSpeed: -0.02, shininess: 40, tilt: 3.1 },
    { id: "earth", name: "Earth", diameter: 12742, dayLength: 24, yearLength: 365.25, moons: 1, distanceFromSun: 149.6, temperature: 15, atmosphere: ["Nitrogen", "Oxygen"], color: "#2B82C9", size: 1.0, orbitRadius: 32, orbitSpeed: 0.30, rotationSpeed: 1.0, shininess: 50, tilt: 0.41 },
    { id: "mars", name: "Mars", diameter: 6779, dayLength: 24.6, yearLength: 687, moons: 2, distanceFromSun: 227.9, temperature: -63, atmosphere: ["Carbon Dioxide"], color: "#C1440E", size: 0.53, orbitRadius: 44, orbitSpeed: 0.24, rotationSpeed: 0.98, shininess: 30, tilt: 0.44 },
    { id: "jupiter", name: "Jupiter", diameter: 139820, dayLength: 9.9, yearLength: 4333, moons: 95, distanceFromSun: 778.6, temperature: -110, atmosphere: ["Hydrogen", "Helium"], color: "#D4A373", size: 2.5, orbitRadius: 62, orbitSpeed: 0.13, rotationSpeed: 2.4, shininess: 20, tilt: 0.05 },
    { id: "saturn", name: "Saturn", diameter: 116460, dayLength: 10.7, yearLength: 10759, moons: 146, distanceFromSun: 1433.5, temperature: -140, atmosphere: ["Hydrogen", "Helium"], color: "#E2C974", size: 2.1, orbitRadius: 82, orbitSpeed: 0.09, rotationSpeed: 2.2, shininess: 25, tilt: 0.47, ring: { innerRadius: 2.6, outerRadius: 4.8, color: "#C8B588", opacity: 0.85 } },
    { id: "uranus", name: "Uranus", diameter: 50724, dayLength: 17.2, yearLength: 30687, moons: 28, distanceFromSun: 2872.5, temperature: -195, atmosphere: ["Hydrogen", "Helium", "Methane"], color: "#7DE8E8", size: 1.5, orbitRadius: 102, orbitSpeed: 0.07, rotationSpeed: -1.4, shininess: 35, tilt: 1.71 },
    { id: "neptune", name: "Neptune", diameter: 49244, dayLength: 16.1, yearLength: 60190, moons: 16, distanceFromSun: 4495.1, temperature: -200, atmosphere: ["Hydrogen", "Helium", "Methane"], color: "#2B5BE8", size: 1.45, orbitRadius: 122, orbitSpeed: 0.05, rotationSpeed: 1.5, shininess: 45, tilt: 0.49 }
  ]
};

async function fetchJsonWithFallback(candidates) {
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function main() {
  // 1. Load planet and mission datasets with path fallbacks
  const planetCandidates = ['./data/planets.json', 'data/planets.json', '/solaris/data/planets.json', '/data/planets.json'];
  const missionCandidates = ['./data/missions.json', 'data/missions.json', '/solaris/data/missions.json', '/data/missions.json'];

  let [planetData, missionsData] = await Promise.all([
    fetchJsonWithFallback(planetCandidates),
    fetchJsonWithFallback(missionCandidates),
  ]);

  if (!planetData) {
    console.warn('[SOLARIS] Using emergency fallback planet data');
    planetData = FALLBACK_PLANET_DATA;
  }

  // 2. Three.js scene + renderer + starfield + lighting + bloom composer + cosmic nebula + 3D comet
  const solarSystem = new SolarSystem();

  // 3. Camera (far start; intro approach fires on ENTER)
  const cameraCtrl = new CameraController(solarSystem.renderer.domElement);
  solarSystem.setCamera(cameraCtrl.camera);

  // 4. Sun + 8 planets + orbit paths + 3D moons + Earth atmospheric clouds + night city lights
  const planetManager = new PlanetManager(solarSystem.scene, planetData);

  // 5. 3D Real-Time Spacecraft Missions (Voyager 1/2, JWST, Cassini, Parker, Artemis II, New Horizons)
  const missions3D = new Missions3DManager(solarSystem.scene, planetManager);

  // 6. Main Asteroid Belt + Jupiter L4 & L5 Trojan asteroid swarms
  const asteroidBelt = new AsteroidBelt(solarSystem.scene);

  // 7. Ambient audio — muted by default; activated after ENTER gesture
  const audio = new AudioManager();

  // 8. Shared mutable time state (multiplier in simulated days per real second)
  // At 1×: 365.25 / 30 ≈ 12.175 days/sec (Earth orbit completes in 30 seconds)
  const timeState = {
    multiplier: 365.25 / 30, // 1× real rate default
    simDays:    0,           // accumulated simulated days since launch (today)
  };

  // 9. UI layer
  const ui = new UIManager(planetData, timeState, cameraCtrl, planetManager);
  ui.setSolarSystem(solarSystem);
  solarSystem.onFpsUpdate = (fps) => ui.updateFps(fps);

  if (missionsData) {
    ui.setMissionsData(missionsData);
  }
  ui.setMissions3D(missions3D);

  // 10. Interaction layer (raycasting, hovering, selection)
  const interactions = new InteractionManager({
    scene:         solarSystem.scene,
    camera:        cameraCtrl.camera,
    renderer:      solarSystem.renderer,
    planetManager,
    ui,
    cameraCtrl,
  });
  interactions.setMissions3D(missions3D);

  // 11. 3D Floating Labels (NASA Eyes projected labels)
  const labelsOverlay = document.getElementById('labels-3d-overlay');
  const labels3D = new Labels3DManager(cameraCtrl.camera, labelsOverlay, {
    onSelectPlanet: (id) => interactions.navigateTo(id),
    onSelectMission: (id) => interactions.navigateTo(id),
  });
  ui.setLabels3D(labels3D);

  // Register Sun in 3D labels
  labels3D.register({
    id: 'sun',
    name: 'Sun',
    type: 'star',
    getPosition: (out) => (out ? out.set(0, 0, 0) : new THREE.Vector3(0, 0, 0)),
  });

  // Register all 8 planets in 3D labels
  planetData.planets.forEach((p) => {
    labels3D.register({
      id: p.id,
      name: p.name,
      type: 'planet',
      getPosition: (out) => {
        const pObj = planetManager.getPlanetObject(p.id);
        if (!pObj) return null;
        if (!out) out = new THREE.Vector3();
        pObj.group.getWorldPosition(out);
        return out;
      },
    });
  });

  // Register all 3D spacecraft missions in 3D labels
  missions3D.getSpacecraftList().forEach((sc) => {
    labels3D.register({
      id: sc.data.id,
      name: sc.data.name,
      type: 'mission',
      getPosition: (out) => {
        if (!out) out = new THREE.Vector3();
        sc.group.getWorldPosition(out);
        return out;
      },
    });
  });

  // 12. AI Assistant widget
  const aiAssistant = new AIAssistant({
    onNavigate: (id) => interactions.navigateTo(id),
  });
  ui.setAIAssistant(aiAssistant);

  // 13. Activate ENTER button once the scene is fully built
  ui.setSplashReady({
    onEnter: () => {
      // Cinematic fly-in; audio fades in when approach completes
      cameraCtrl.introApproach(() => {
        audio.postIntroFadeIn();
      });

      // Enable hover + click raycasting 2 s into the approach
      setTimeout(() => interactions.setSceneReady(), 2000);
    },
  });

  // 14. Render loop
  solarSystem.start((delta) => {
    const simDelta = delta * timeState.multiplier;
    timeState.simDays += simDelta;

    cameraCtrl.update();
    planetManager.update(simDelta);

    // Synchronize Trojan asteroids with Jupiter's orbital angle
    const jupiterObj = planetManager.getPlanetObject('jupiter');
    const jupiterAngle = jupiterObj ? jupiterObj.angle : undefined;
    asteroidBelt.update(simDelta, jupiterAngle);

    // Update real-time 3D spacecraft positions and camera-facing beacons
    missions3D.update(simDelta, cameraCtrl.camera);

    // Update screen-projected 3D floating labels
    labels3D.update();

    interactions.update(delta);
    ui.update();
  });
}

main().catch((err) => {
  console.error('[SOLARIS Bootstrap Error]:', err);
  const enterBtn = document.getElementById('enter-btn');
  const enterLabel = document.getElementById('enter-label');
  if (enterBtn && enterLabel) {
    enterLabel.textContent = 'ENTER';
    enterBtn.disabled = false;
    enterBtn.onclick = () => {
      const splash = document.getElementById('splash-screen');
      if (splash) splash.remove();
    };
  }
});
