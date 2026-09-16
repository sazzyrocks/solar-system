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

async function main() {
  // 1. Load planet and mission datasets in parallel
  let planetData = null;
  let missionsData = null;

  try {
    const [pRes, mRes] = await Promise.all([
      fetch('./data/planets.json'),
      fetch('./data/missions.json').catch(() => null),
    ]);

    if (!pRes.ok) throw new Error(`Planets HTTP ${pRes.status}`);
    planetData = await pRes.json();

    if (mRes && mRes.ok) {
      missionsData = await mRes.json();
    }
  } catch (err) {
    console.error('[SOLARIS] Failed to load data:', err);
    return;
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

main();
