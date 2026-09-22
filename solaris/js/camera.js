/**
 * camera.js — SOLARIS Phase C & D Dynamic Orbit Tracking & Cinematic Tour
 * Responsibility: PerspectiveCamera, OrbitControls, dynamic target interpolation,
 * moving planet lock-on tracking, and Cinematic Solar System Tour mode.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const gsap = window.gsap;

// Reusable scratch vectors to eliminate per-frame GC allocations and micro-hitches
const _tempPos    = new THREE.Vector3();
const _desiredTgt = new THREE.Vector3();
const _deltaVec   = new THREE.Vector3();
const _destCam    = new THREE.Vector3();
const _destTgt    = new THREE.Vector3();

export class CameraController {
  constructor(domElement) {
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      3000,
    );

    // Initial cinematic viewpoint
    this.camera.position.set(0, 280, 560);
    this.camera.lookAt(0, 0, 0);

    this.controls         = this._createControls(domElement);
    this.controls.enabled = false;

    this._isAnimating     = false;

    // Moving target tracking
    this._trackedPlanet   = null;
    this._camOffset       = new THREE.Vector3(0, 30, 80);
    this._targetOffset    = new THREE.Vector3(0, 0, 0);

    // Dynamic flight transition state
    this._flightTween     = null;

    // Cinematic Tour state
    this._isTouring       = false;
    this._tourTimeout     = null;

    // Top-Down Orrery mode
    this._isTopDown       = false;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  // ─── OrbitControls ───────────────────────────────────────────────────────────

  _createControls(domElement) {
    const ctrl = new OrbitControls(this.camera, domElement);

    ctrl.enableDamping  = true;
    ctrl.dampingFactor  = 0.042; // Ultra-smooth inertia drift
    ctrl.minDistance    = 1.2;
    ctrl.maxDistance    = 750;
    ctrl.minPolarAngle  = 0.05;
    ctrl.maxPolarAngle  = Math.PI - 0.05;
    ctrl.enablePan      = true;
    ctrl.panSpeed       = 0.70;
    ctrl.rotateSpeed    = 0.55;
    ctrl.zoomSpeed      = 0.75; // Silky mouse-wheel zoom (no sudden steps)
    ctrl.target.set(0, 0, 0);
    ctrl.update();
    return ctrl;
  }

  // ─── Per-Frame Tracking ─────────────────────────────────────────────────────

  update() {
    if (this._isAnimating) return;

    if (this._trackedPlanet) {
      this._trackedPlanet.group.getWorldPosition(_tempPos);

      _desiredTgt.copy(_tempPos).add(this._targetOffset);
      _deltaVec.copy(_desiredTgt).sub(this.controls.target);

      // Smooth tracking interpolation to eliminate micro-jitter
      this.controls.target.lerp(_desiredTgt, 0.14);
      this.camera.position.add(_deltaVec);
      this.controls.update();
      return;
    }

    if (this._trackedSpacecraft) {
      this._trackedSpacecraft.group.getWorldPosition(_tempPos);

      _desiredTgt.copy(_tempPos).add(this._targetOffset);
      _deltaVec.copy(_desiredTgt).sub(this.controls.target);

      this.controls.target.lerp(_desiredTgt, 0.14);
      this.camera.position.add(_deltaVec);
      this.controls.update();
      return;
    }

    this.controls.update();
  }

  // ─── Core Flight to Moving Planet ───────────────────────────────────────────

  /**
   * Dynamically fly to a moving planet.
   * Interpolates camera position and target toward the moving planet's live coordinates,
   * completely eliminating orbital lag and framing the planet perfectly.
   */
  flyToPlanet(planetObj, mode = 'standard', onComplete) {
    if (this._flightTween) {
      this._flightTween.kill();
      this._flightTween = null;
    }

    this._trackedPlanet   = planetObj;
    this._isTopDown       = false;
    this._isAnimating     = true;
    this.controls.enabled = false;

    const size = planetObj.data.size;
    let offset;

    if (planetObj.data.id === 'saturn') {
      // Saturn rings vantage angle (~35° elevation, clear elliptical view)
      offset = new THREE.Vector3(size * 4.2, size * 2.8, size * 5.2);
    } else if (mode === 'explore') {
      // Intimate surface exploration
      offset = new THREE.Vector3(size * 1.4, size * 0.7, size * 2.0);
    } else if (mode === 'orbit') {
      // Free orbit viewpoint
      offset = new THREE.Vector3(0, size * 2.2, size * 6.5);
    } else {
      // Standard inspection framing
      offset = new THREE.Vector3(size * 2.4, size * 1.4, size * 3.8);
    }

    this._camOffset.copy(offset);
    // Framed slightly above center so bottom detail panel doesn't obstruct
    this._targetOffset.set(0, -size * 0.25, 0);

    const startCamPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const progressObj = { t: 0 };

    this._flightTween = gsap.to(progressObj, {
      t: 1.0,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        planetObj.group.getWorldPosition(_tempPos);

        _destCam.copy(_tempPos).add(this._camOffset);
        _destTgt.copy(_tempPos).add(this._targetOffset);

        this.camera.position.lerpVectors(startCamPos, _destCam, progressObj.t);
        this.controls.target.lerpVectors(startTarget, _destTgt, progressObj.t);
        this.camera.lookAt(this.controls.target);
      },
      onComplete: () => {
        this._isAnimating = false;
        this.controls.enabled = true;

        planetObj.group.getWorldPosition(_tempPos);
        this.controls.target.copy(_tempPos).add(this._targetOffset);
        this.controls.update();

        this._flightTween = null;
        onComplete?.();
      },
    });
  }

  // ─── Fly To Spacecraft (Probe Tracking) ───────────────────────────────────────

  flyToSpacecraft(spacecraft, onComplete) {
    if (this._flightTween) {
      this._flightTween.kill();
      this._flightTween = null;
    }

    this._trackedPlanet     = null;
    this._trackedSpacecraft = spacecraft;
    this._isTopDown         = false;
    this._isAnimating       = true;
    this.controls.enabled   = false;

    // Spacecraft offset: framing probe nicely in close-up 3D view
    this._camOffset.set(2.8, 1.4, 3.6);
    this._targetOffset.set(0, 0, 0);

    const startCamPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const progressObj = { t: 0 };

    this._flightTween = gsap.to(progressObj, {
      t: 1.0,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        spacecraft.group.getWorldPosition(_tempPos);

        _destCam.copy(_tempPos).add(this._camOffset);
        _destTgt.copy(_tempPos).add(this._targetOffset);

        this.camera.position.lerpVectors(startCamPos, _destCam, progressObj.t);
        this.controls.target.lerpVectors(startTarget, _destTgt, progressObj.t);
        this.camera.lookAt(this.controls.target);
      },
      onComplete: () => {
        this._isAnimating     = false;
        this.controls.enabled = true;
        spacecraft.group.getWorldPosition(_tempPos);
        this.controls.target.copy(_tempPos);
        this.controls.update();
        this._flightTween = null;
        onComplete?.();
      },
    });
  }

  // ─── Free Camera Move ────────────────────────────────────────────────────────

  moveTo(position, target, duration = 2.4, ease = 'power3.inOut', onComplete) {
    if (typeof ease === 'function') { onComplete = ease; ease = 'power3.inOut'; }

    if (this._flightTween) {
      this._flightTween.kill();
      this._flightTween = null;
    }

    this._trackedPlanet   = null;
    this._isAnimating     = true;
    this.controls.enabled = false;

    const startPos    = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const progressObj = { t: 0 };

    this._flightTween = gsap.to(progressObj, {
      t: 1.0,
      duration,
      ease,
      onUpdate: () => {
        this.camera.position.lerpVectors(startPos, position, progressObj.t);
        this.controls.target.lerpVectors(startTarget, target, progressObj.t);
        this.camera.lookAt(this.controls.target);
      },
      onComplete: () => {
        this._isAnimating = false;
        this.controls.enabled = true;
        this.controls.target.copy(target);
        this.controls.update();
        this._flightTween = null;
        onComplete?.();
      },
    });
  }

  introApproach(onComplete) {
    this._trackedPlanet = null;
    this.moveTo(
      new THREE.Vector3(0, 95, 195),
      new THREE.Vector3(0, 0, 0),
      3.5,
      'power2.inOut',
      onComplete
    );
  }

  orbitAround(worldPos, planetSize) {
    if (this._trackedPlanet) {
      this.flyToPlanet(this._trackedPlanet, 'orbit');
    }
  }

  explorePlanet(worldPos, planetSize) {
    if (this._trackedPlanet) {
      this.flyToPlanet(this._trackedPlanet, 'explore');
    }
  }

  clearTrackedPlanet() {
    this._trackedPlanet = null;
  }

  resetView() {
    this.stopTour();
    this.clearTrackedPlanet();
    this._isTopDown = false;
    this.moveTo(
      new THREE.Vector3(0, 95, 195),
      new THREE.Vector3(0, 0, 0),
      2.2,
    );
  }

  // ─── Top-Down Orrery View (Concentric Orbital Perspective) ───────────────────

  flyToTopDownOverview(onComplete) {
    this.stopTour();
    this.clearTrackedPlanet();
    this._trackedSpacecraft = null;
    this._isTopDown = true;
    this.moveTo(
      new THREE.Vector3(0, 360, 0.001),
      new THREE.Vector3(0, 0, 0),
      2.4,
      'power2.inOut',
      onComplete
    );
  }

  toggleTopDownOverview(onComplete) {
    if (this._isTopDown) {
      this.resetView();
      return false;
    } else {
      this.flyToTopDownOverview(onComplete);
      return true;
    }
  }

  isTopDown() {
    return !!this._isTopDown;
  }

  // ─── Automated Cinematic Solar System Tour ───────────────────────────────────

  startTour(planetManager, onPlanetVisit, onTourEnd) {
    this.stopTour();
    this._isTouring = true;

    const tourPlanets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
    let idx = 0;

    const nextStop = () => {
      if (!this._isTouring) return;

      if (idx >= tourPlanets.length) {
        this.resetView();
        onTourEnd?.();
        return;
      }

      const pId = tourPlanets[idx];
      const pObj = planetManager.getPlanetObject(pId);
      idx++;

      if (!pObj) { nextStop(); return; }

      onPlanetVisit?.(pId, idx, tourPlanets.length);
      this.flyToPlanet(pObj, 'standard', () => {
        if (!this._isTouring) return;

        // Linger and rotate slightly for 4.2 seconds
        this._tourTimeout = setTimeout(() => {
          if (this._isTouring) nextStop();
        }, 4200);
      });
    };

    nextStop();
  }

  stopTour() {
    this._isTouring = false;
    if (this._tourTimeout) {
      clearTimeout(this._tourTimeout);
      this._tourTimeout = null;
    }
  }

  isTouring() {
    return this._isTouring;
  }
}
